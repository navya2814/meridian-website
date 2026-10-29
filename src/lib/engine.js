// Meridian finance engine: reserves, true profit, outlook, ranking, scenarios and forecasts.
// Pure functions over the data in data.js, plus a few mutable settings (reserve rules,
// accountant overrides and businesses added by the user) that the UI changes.

import { CR, LK, inr, inrFull, pct, fmtDate, daysOld, clone, mixHex, DATA_AS_OF } from './format.js';
import {
  QTRS, MON, DOCS, BS_ROWS, COMPANIES, CO, FAMILY, MARKET, LENDERS, SELLABLE, FUND_META,
  YEARS, FD_RATE, CASH_RATE, INV_RATE, PROP_RATE,
} from './data.js';
import { store } from './storage.js';

export const mktChange = (k, back = 11) => { const s = MARKET[k].s; return s[s.length - 1] / s[s.length - 1 - back] - 1; };

/* ---------- reserve and provision rules (editable in Settings) ---------- */
export const DEFAULT_RULES = { gratDays:15, pfRate:0.12, bonusRate:0.0833, bonusMonths:6, bad:[0.01,0.05,0.20,0.60], emerMonths:4, catchUp:3, stockLoss:{ hyg:0.035, oil:0.05, jute:0.045, jj:0.022 } };
export const RULES = clone(DEFAULT_RULES);
export function resetRules() {
  const d = clone(DEFAULT_RULES);
  Object.keys(RULES).forEach(k => delete RULES[k]);
  Object.assign(RULES, d);
}
/** Accountant overrides, keyed `${companyId}.${fundKey}` -> { amt, note, by, date } */
export const OVERRIDES = {};

/* ---------- funds and true profit ---------- */
export function funds(c) {
  const R = RULES, crs = x => x / CR;
  const monthlyBasic = c.staff * c.basic;
  const out = {};
  out.grat = { need:crs(monthlyBasic * (R.gratDays / 26) * c.years), accrual:crs(monthlyBasic * (R.gratDays / 26)),
    why:`${c.staff} staff × average basic pay ${inrFull(c.basic)} a month × ${R.gratDays} days for every 26 working days × ${c.years} average years of service.` };
  out.pf = { need:crs(monthlyBasic * R.pfRate * 2 * c.pfMonths), why:`Employer and employee share at ${(R.pfRate * 100).toFixed(0)}% each on basic pay, for ${c.pfMonths} month${c.pfMonths > 1 ? 's' : ''} not yet deposited.` };
  out.bonus = { need:crs(monthlyBasic * R.bonusRate * R.bonusMonths), why:`${(R.bonusRate * 100).toFixed(2)}% of basic pay for the ${R.bonusMonths} months since April, payable at Diwali.` };
  out.leave = { need:crs(monthlyBasic / 26 * c.leaveDays), why:`Average ${c.leaveDays} days of unused leave per person, valued at basic pay.` };
  out.pay = { need:c.pendingPay, why:'Salary and overtime for September entered in the wages register but not yet paid.' };
  out.cont = { need:c.contingencies.reduce((s, x) => s + x.a * x.p, 0), why:c.contingencies.length ? c.contingencies.map(x => `${x.n}: ${inr(x.a * CR)} × ${(x.p * 100).toFixed(0)}% chance`).join('; ') + '.' : 'No possible liabilities recorded yet.' };
  out.bad = { need:c.aging.reduce((s, a, i) => s + a * R.bad[i], 0), why:`Unpaid invoices by age: ${['0 to 30', '31 to 90', '91 to 180', 'over 180'].map((l, i) => `${inr(c.aging[i] * CR)} ${l} days at ${(R.bad[i] * 100).toFixed(0)}%`).join(', ')}.` };
  out.repl = { need:c.assets.reduce((s, a) => s + a.cost * Math.min(1, a.age / a.life), 0), why:"Share of each asset's useful life already used up: " + c.assets.map(a => `${a.n} (${a.age} of ${a.life} years)`).join(', ') + '.' };
  const sl = R.stockLoss[c.id] ?? 0.03;
  out.stock = { need:c.bs.inventory * sl, why:`${(sl * 100).toFixed(1)}% of stock worth ${inr(c.bs.inventory * CR)}, covering spoilage, slow-moving goods and a fall in ${c.rawName.toLowerCase()} prices.` };
  out.emer = { need:c.fixedMonthly * R.emerMonths, why:`${R.emerMonths} months of running costs (${inr(c.fixedMonthly * CR)} a month for salaries, power, rent and interest; raw material buying excluded).` };
  for (const k in out) {
    const ov = OVERRIDES[`${c.id}.${k}`];
    out[k].auto = out[k].need;
    if (ov) { out[k].need = ov.amt; out[k].override = ov; }
    out[k].set = c.set[k];
    out[k].short = Math.max(0, out[k].need - out[k].set);
    const m = FUND_META[k].charge;
    out[k].charge = (m === 'accrual' ? out[k].accrual : 0) + (m === 'full' ? out[k].short : out[k].short / R.catchUp);
  }
  return out;
}

export function metrics(c) {
  const ttmRev = c.rev.slice(4).reduce((a, b) => a + b, 0);
  const prevRev = c.rev.slice(0, 4).reduce((a, b) => a + b, 0);
  const ttmProfit = c.rev.slice(4).reduce((s, r, i) => s + r * c.mar[4 + i] / 100, 0);
  const prevProfit = c.rev.slice(0, 4).reduce((s, r, i) => s + r * c.mar[i] / 100, 0);
  const f = funds(c);
  const provCharge = Object.values(f).reduce((s, x) => s + x.charge, 0);
  const totalNeed = Object.values(f).reduce((s, x) => s + x.need, 0);
  const totalSet = Object.values(f).reduce((s, x) => s + x.set, 0);
  const trueProfit = ttmProfit - provCharge;
  const b = c.bs;
  const assets = b.cash + b.receivables + b.inventory + b.plant + b.land + b.other;
  const liab = b.debt + b.payables + b.advances + b.otherL;
  const equity = assets - liab;
  return { ttmRev, prevRev, revGrowth:ttmRev / prevRev - 1, ttmProfit, prevProfit, profitGrowth:ttmProfit / prevProfit - 1,
    funds:f, provCharge, totalNeed, totalSet, shortfall:Math.max(0, totalNeed - totalSet), trueProfit, assets, liab, equity,
    margin:ttmProfit / ttmRev, trueMargin:trueProfit / ttmRev, marginChange:(c.mar[7] - c.mar[3]) / 100, debtChange:c.debtHist[3] ? c.debtHist[7] / c.debtHist[3] - 1 : 0,
    roce:ttmProfit / c.capital, trueRoce:trueProfit / c.capital, de:b.debt / equity, turnover:ttmRev / c.capital,
    interest:b.debt * c.rate, months:b.cash / c.fixedMonthly, invDays:c.invDays[7], invDaysChange:c.invDays[7] - c.invDays[3],
    unfunded:Object.entries(f).filter(([k, x]) => k !== 'emer' && k !== 'repl' && x.short > 0.25 * x.need && x.short > 0.1) };
}

export function outlook(c, m) {
  const ext = MARKET[c.market.key];
  const mk = mktChange(c.market.key, 5);
  let score = 0;
  score += m.revGrowth > 0.08 ? 2 : m.revGrowth > 0.02 ? 1 : m.revGrowth < -0.02 ? -2 : 0;
  score += m.marginChange > 0.003 ? 1 : m.marginChange < -0.003 ? -1 : 0;
  score += m.debtChange < -0.03 ? 1 : m.debtChange > 0.08 ? -2 : 0;
  score += m.trueRoce > 0.15 ? 1 : m.trueRoce < 0.05 ? -1 : 0;
  score += m.invDaysChange > 20 ? -1 : 0;
  const unfundedAmt = m.unfunded.reduce((s, [, x]) => s + x.short, 0);
  score += unfundedAmt > 0.25 * m.ttmProfit ? -1 : 0;
  score += (c.market.sens * mk) > 0.004 ? 1 : (c.market.sens * mk) < -0.006 ? -1 : 0;
  const tag = score >= 3 ? 'growing' : score <= -2 ? 'risk' : 'stable';
  const inside = [], outside = [];
  inside.push(`Sales over the last 12 months ${m.revGrowth >= 0 ? 'rose' : 'fell'} ${Math.abs(m.revGrowth * 100).toFixed(1)}% to ${inr(m.ttmRev * CR)}.`);
  inside.push(`Profit margin ${m.marginChange >= 0 ? 'improved' : 'slipped'} from ${c.mar[3].toFixed(1)}% to ${c.mar[7].toFixed(1)}% over four quarters.`);
  inside.push(`Debt ${m.debtChange > 0.01 ? 'rose' : m.debtChange < -0.01 ? 'fell' : 'held'} ${Math.abs(m.debtChange * 100).toFixed(0)}% to ${inr(c.debtHist[7] * CR)}.`);
  if (c.id === 'jj') inside.push(`Stock now takes ${m.invDays} days to sell, up from ${c.invDays[3]} a year ago, so cash is locked in unsold jewellery.`);
  else inside.push(`Stock turns in ${m.invDays} days (${m.invDaysChange <= 0 ? 'faster' : 'slower'} than ${c.invDays[3]} a year ago).`);
  if (m.unfunded.length) inside.push(`Unfunded obligations of ${inr(unfundedAmt * CR)} (${m.unfunded.map(([k]) => FUND_META[k].n.toLowerCase()).join(', ')}) reduce true profit.`);
  const mk12 = mktChange(c.market.key);
  const dir = mk > 0 ? 'up' : 'down';
  if (c.id === 'jj') {
    outside.push(`Gold is ${dir} ${Math.abs(mk * 100).toFixed(1)}% in six months and ${(mk12 * 100).toFixed(0)}% in a year. Stock on hand gains value, but buyers are trading down to lighter pieces.`);
    outside.push('Wedding and Diwali demand peaks in October and November, which usually lifts sales for one quarter only.');
    outside.push('Mandatory hallmarking and tighter cash-purchase rules add compliance cost for mid-sized jewellers.');
  } else if (c.id === 'oil') {
    outside.push(`Crude palm oil is ${dir} ${Math.abs(mk * 100).toFixed(1)}% in six months, and the company passes on price rises to buyers with a lag of about a quarter.`);
    outside.push(`Brent crude is up ${(mktChange('crude') * 100).toFixed(0)}% in a year, which raises freight and packaging costs.`);
    outside.push('Import duty on crude edible oil can change at short notice, which moves margins either way.');
  } else if (c.id === 'jute') {
    outside.push(`Raw jute is ${dir} ${Math.abs(mk * 100).toFixed(1)}% from its August peak as the new crop arrives.`);
    outside.push('Government rules that require jute packaging for foodgrains keep order books steady.');
    outside.push(`${(c.topCust * 100).toFixed(0)}% of sales come from government sacking orders, so one buyer sets the pace.`);
  } else if (c.id === 'hyg') {
    outside.push(`Fluff pulp is ${dir} ${Math.abs(mk * 100).toFixed(1)}% in six months, which helps margins.`);
    outside.push('Demand for diapers and sanitary pads in eastern India is growing in smaller towns as more buyers switch to packaged products.');
    outside.push('Large national brands are cutting prices in metros, so growth depends on distributor reach in smaller towns.');
  } else {
    outside.push(`${ext.n} is ${dir} ${Math.abs(mk * 100).toFixed(1)}% in six months and ${mk12 >= 0 ? 'up' : 'down'} ${Math.abs(mk12 * 100).toFixed(0)}% in a year.`);
    outside.push(`${c.rawName} makes up about ${(c.rawDep * 100).toFixed(0)}% of costs, so price moves there feed straight into the margin.`);
    outside.push("Market notes for this business will get more specific once its own ledgers and stock registers are imported.");
  }
  return { tag, score, label:{ growing:'Growing', stable:'Stable', risk:'At risk' }[tag], inside, outside };
}

export function ranking() {
  const rows = COMPANIES.map(c => { const m = metrics(c); return { c, m, roce:m.trueRoce, cashDays:c.cashDays, margin:m.trueMargin, de:m.de, dep:Math.max(c.rawDep, c.topCust) }; });
  const norm = (vals, hiGood) => { const mn = Math.min(...vals), mx = Math.max(...vals); return vals.map(v => mx === mn ? 50 : (hiGood ? (v - mn) / (mx - mn) : (mx - v) / (mx - mn)) * 100); };
  const W = { roce:0.35, cashDays:0.2, margin:0.2, de:0.15, dep:0.1 };
  const n = { roce:norm(rows.map(r => r.roce), true), cashDays:norm(rows.map(r => r.cashDays), false), margin:norm(rows.map(r => r.margin), true), de:norm(rows.map(r => r.de), false), dep:norm(rows.map(r => r.dep), false) };
  rows.forEach((r, i) => { r.score = Object.keys(W).reduce((s, k) => s + W[k] * n[k][i], 0); });
  return rows.sort((a, b) => b.score - a.score);
}

export function familyTotals() {
  const inv = FAMILY.investments.reduce((s, x) => s + x.val, 0);
  const prop = FAMILY.property.reduce((s, x) => s + x.val, 0);
  const personalAssets = inv + prop + FAMILY.cash + FAMILY.vehicles + FAMILY.gold;
  const personalLiab = FAMILY.loans.reduce((s, x) => s + x.amt, 0);
  const ms = COMPANIES.map(c => metrics(c));
  const coAssets = ms.reduce((s, m) => s + m.assets, 0), coLiab = ms.reduce((s, m) => s + m.liab, 0);
  const coCash = COMPANIES.reduce((s, c) => s + c.bs.cash, 0);
  return { inv, prop, personalAssets, personalLiab, coAssets, coLiab, coCash,
    assets:coAssets + personalAssets, liab:coLiab + personalLiab, nw:coAssets + personalAssets - coLiab - personalLiab,
    cash:coCash + FAMILY.cash, fixedMonthly:COMPANIES.reduce((s, c) => s + c.fixedMonthly, 0) + 0.12,
    sales:ms.reduce((s, m) => s + m.ttmRev, 0), prevSales:ms.reduce((s, m) => s + m.prevRev, 0),
    bookProfit:ms.reduce((s, m) => s + m.ttmProfit, 0), prevProfit:ms.reduce((s, m) => s + m.prevProfit, 0),
    trueProfit:ms.reduce((s, m) => s + m.trueProfit, 0) };
}

/* ---------- source rows behind every figure ---------- */
const docById = id => DOCS.find(d => d.id === id);
export function bsRow(c, item, label) { const d = docById(c.bsDoc); return { doc:d.file, sheet:'Balance Sheet', row:BS_ROWS[item], desc:`${c.short}: ${label}`, amt:c.bs[item] * CR, date:d.date }; }
export function famRow(label, amt, row) { const d = docById('d15'); return { doc:d.file, sheet:'Holdings', row, desc:label, amt:amt * CR, date:d.date }; }
export function plRows(c) { const d = docById(c.plDoc); return c.rev.slice(4).map((r, i) => ({ doc:d.file, sheet:'Profit and Loss', row:12 + i * 9, desc:`${c.short}: sales, ${QTRS[4 + i]}`, amt:r * CR, date:d.date })); }
const BS_LABEL = { cash:'cash and bank balances', receivables:'amounts due from customers', inventory:'stock', plant:'plant and machinery', land:'land and buildings', other:'other assets', debt:'borrowings', payables:'amounts due to suppliers', advances:'customer advances', otherL:'other liabilities' };

export function traceFor(key) {
  const ft = familyTotals();
  const coRows = item => COMPANIES.map(c => bsRow(c, item, BS_LABEL[item]));
  if (key === 'cash') return { label:'Total family cash', value:ft.cash * CR, rows:[...coRows('cash'), famRow('Family savings accounts', FAMILY.cash, 4)] };
  if (key === 'assets') return { label:'Total assets', value:ft.assets * CR, rows:[...['cash', 'receivables', 'inventory', 'plant', 'land', 'other'].flatMap(coRows), ...FAMILY.investments.map(x => famRow(x.n, x.val, x.row)), ...FAMILY.property.map(x => famRow(x.n, x.val, x.row)), famRow('Family cash', FAMILY.cash, 4), famRow('Vehicles', FAMILY.vehicles, 34), famRow('Physical gold', FAMILY.gold, 35)] };
  if (key === 'liab') return { label:'Total liabilities', value:ft.liab * CR, rows:[...['debt', 'payables', 'advances', 'otherL'].flatMap(coRows).filter(r => r.amt > 0), ...FAMILY.loans.map((l, i) => famRow(l.n, l.amt, 40 + i))] };
  if (key === 'nw') return { label:'Net worth', value:ft.nw * CR, rows:[...COMPANIES.map(c => { const m = metrics(c), d = docById(c.bsDoc); return { doc:d.file, sheet:'Balance Sheet', row:44, desc:`${c.short}: total assets less total liabilities`, amt:m.equity * CR, date:d.date }; }), famRow('Family holdings outside the businesses, less personal loans', ft.personalAssets - ft.personalLiab, 48)] };
  return null;
}

export function fundRows(c, k, x) {
  const staff = docById('d13'), age = docById('d14'), fa = docById('d16'), bs = docById(c.bsDoc);
  const base = { grat:staff, pf:staff, bonus:staff, leave:staff, pay:c.id === 'jute' ? docById('d9') : staff, bad:age, repl:fa, stock:bs, cont:bs, emer:bs }[k];
  const r0 = { hyg:12, oil:410, jute:640, jj:1290 }[c.id] || 20;
  if (k === 'bad') return c.aging.map((a, i) => ({ doc:age.file, sheet:c.short, row:(r0 / 10 + 8 + i * 30) | 0, desc:`${['0 to 30', '31 to 90', '91 to 180', 'Over 180'][i]} days: ${inr(a * CR)} at ${(RULES.bad[i] * 100).toFixed(0)}%`, amt:a * RULES.bad[i] * CR, date:age.date }));
  if (k === 'repl') return c.assets.map((a, i) => ({ doc:fa.file, sheet:'Register', row:20 + i * 7 + r0 % 50, desc:`${a.n}: ${a.age} of ${a.life} years used`, amt:a.cost * Math.min(1, a.age / a.life) * CR, date:fa.date }));
  if (k === 'cont') return c.contingencies.length ? c.contingencies.map((a, i) => ({ doc:bs.file, sheet:'Notes to accounts', row:52 + i, desc:`${a.n}: ${inr(a.a * CR)} × ${(a.p * 100).toFixed(0)}%`, amt:a.a * a.p * CR, date:bs.date })) : [{ doc:bs.file, sheet:'Notes to accounts', row:52, desc:'No possible liabilities recorded', amt:0, date:bs.date }];
  return [{ doc:base.file, sheet:k === 'stock' || k === 'emer' ? 'Balance Sheet' : c.short, row:k === 'stock' ? BS_ROWS.inventory : k === 'emer' ? 58 : r0, desc:`${c.short}: ${FUND_META[k].n.toLowerCase()} (${c.staff} staff)`, amt:x.need * CR, date:base.date }];
}

/* ============ Scenario engine ============ */
export function blankScenario() {
  const per = v => Object.fromEntries(COMPANIES.map(c => [c.id, v]));
  return {
    move:{ on:false, from:'jj', to:'hyg', mode:'pct', pct:0.10, amt:200 },
    invest:{ on:false, co:'hyg', amt:50 },
    withdraw:{ on:false, co:'jj', amt:20 },
    sell:{ on:false, asset:'land_sil', price:500 },
    loan:{ on:false, amt:200, rate:0.105, years:5, co:'hyg' },
    repay:{ on:false, co:'jj', amt:150, mode:'lump', months:12 },
    monthly:{ on:false, ...per(0) },
    growth:{ on:false, ...per(null) },
    outside:{ on:false, gold:0, palm:0, jute:0, pulp:0, sales:0 },
    cases:{ best:{ g:0.02, price:-0.05, sales:0.04 }, worst:{ g:-0.03, price:0.15, sales:-0.08 } },
  };
}

function priceFor(c, sc) {
  const o = sc.outside.on ? sc.outside : { gold:0, palm:0, jute:0, pulp:0, sales:0 };
  return { p:o[c.market.key] || 0, sales:o.sales || 0 };
}

/** Runs a scenario over ten years. `shock` adds growth, price and sales changes for best/worst cases and Monte Carlo runs. */
export function simulate(sc, shock = null) {
  const base = familyTotals();
  const st = COMPANIES.filter(c => CO[c.id]).map(c => { const m = metrics(c); return {
    id:c.id, c, m, K:c.capital, R:m.ttmRev, mar:m.margin, g:c.g, D:c.bs.debt, rate:c.rate, E:m.equity, cash:c.bs.cash,
    prov:m.provCharge, accr:m.funds.grat.accrual, catchPart:m.provCharge - m.funds.grat.accrual,
    turn:m.ttmRev / c.capital, ramp:[], fixed:c.fixedMonthly, inv:c.bs.inventory, assets:m.assets }; });
  const S = Object.fromEntries(st.map(s => [s.id, s]));
  const okCo = id => !!S[id];
  let famCash = FAMILY.cash, fd = FAMILY.investments.find(x => x.type === 'Fixed deposits').val;
  const invest = base.inv - fd;
  let prop = base.prop, other = FAMILY.vehicles + FAMILY.gold;
  let pLoans = base.personalLiab;
  const notes = [];
  let newLoan = null, extraRepay = null, assetGain = 0;
  const addCap = (s, amtCr, label) => { s.K += amtCr; s.E += amtCr; s.ramp.push({ dR:amtCr * s.turn * 0.75, label }); };
  const takeCap = (s, amtCr) => { const frac = Math.min(0.9, amtCr / s.K); const lost = s.R * frac * 0.85; s.K -= amtCr; s.E -= amtCr; s.R -= lost; return lost; };
  const fromFamily = amtCr => { let left = amtCr; const a = Math.min(famCash - 0.5, left); if (a > 0) { famCash -= a; left -= a; } if (left > 0) { const b = Math.min(fd, left); fd -= b; left -= b; } if (left > 0) famCash -= left; };

  if (sc.move.on && sc.move.from !== sc.move.to && okCo(sc.move.from) && okCo(sc.move.to)) {
    const a = S[sc.move.from], b = S[sc.move.to];
    const amt = Math.min(a.K * 0.9, sc.move.mode === 'amt' ? sc.move.amt * LK / CR : a.K * sc.move.pct);
    const lost = takeCap(a, amt); addCap(b, amt, `capital from ${a.c.short}`);
    notes.push(`Moving ${inr(amt * CR)} out of ${a.c.short} removes about ${inr(lost * CR)} of yearly sales there, at its ${pct(a.mar)} margin. The same money in ${b.c.short} earns its ${pct(b.mar)} margin on about ${inr(amt * b.turn * 0.75 * CR)} of new sales once it is fully working, after a ramp-up year.`);
  }
  if (sc.invest.on && okCo(sc.invest.co)) { const s = S[sc.invest.co], amt = sc.invest.amt * LK / CR; fromFamily(amt); addCap(s, amt, 'new investment');
    notes.push(`Putting ${inr(amt * CR)} into ${s.c.short} comes out of family cash and fixed deposits, which were earning about ${pct(FD_RATE)}. ${s.c.short} turns each rupee of capital into ${s.turn.toFixed(2)} rupees of sales at a ${pct(s.mar)} margin.`); }
  if (sc.withdraw.on && okCo(sc.withdraw.co)) { const s = S[sc.withdraw.co], amt = Math.min(sc.withdraw.amt * LK / CR, s.cash + s.inv * 0.3); const lost = takeCap(s, amt); famCash += amt;
    notes.push(`Taking ${inr(amt * CR)} out of ${s.c.short} adds it to family cash but cuts about ${inr(lost * CR)} of yearly sales there.`); }
  if (sc.sell.on) { const a = SELLABLE.find(x => x.id === sc.sell.asset); const price = sc.sell.price * LK / CR; assetGain = price - a.book; famCash += price;
    if (a.co && S[a.co]) { const s = S[a.co]; s.R *= (1 - a.revLoss); s.E -= a.book; if (a.invCut) s.inv -= a.invCut; }
    else if (a.kind === 'Land') prop -= a.book; else other -= a.book;
    notes.push(`Selling ${a.n.toLowerCase()} for ${inr(price * CR)} against a book value of ${inr(a.book * CR)} gives a one-time ${assetGain >= 0 ? 'gain' : 'loss'} of ${inr(Math.abs(assetGain) * CR)} and adds the full price to cash.${a.revLoss ? ` It also trims sales by about ${(a.revLoss * 100).toFixed(0)}% in ${CO[a.co].short}.` : ''}`); }
  if (sc.loan.on && (sc.loan.co === 'fam' || okCo(sc.loan.co))) { const amt = sc.loan.amt * LK / CR, r = sc.loan.rate, n = sc.loan.years * 12, i = r / 12;
    const emi = amt * i / (1 - Math.pow(1 + i, -n)); newLoan = { amt, r, n, emi, co:sc.loan.co };
    if (sc.loan.co === 'fam') famCash += amt; else { const s = S[sc.loan.co]; s.D += amt; addCap(s, amt, 'loan money'); s.E -= amt; }
    notes.push(`A loan of ${inr(amt * CR)} at ${pct(r)} over ${sc.loan.years} years costs ${inr(emi * CR)} a month. In the first year about ${inr(amt * r * 0.92 * CR)} of that is interest, which comes straight off profit.`); }
  if (sc.repay.on && okCo(sc.repay.co)) { const s = S[sc.repay.co], amt = Math.min(sc.repay.amt * LK / CR, s.D);
    if (sc.repay.mode === 'lump') { fromFamily(amt); s.D -= amt; notes.push(`Repaying ${inr(amt * CR)} of ${s.c.short}'s debt in one go saves about ${inr(amt * s.rate * CR)} of interest a year at ${pct(s.rate)}, but uses cash that was earning only ${pct(FD_RATE)}.`); }
    else { extraRepay = { s, amt, months:sc.repay.months, per:amt / sc.repay.months }; notes.push(`Repaying ${inr(amt * CR)} of ${s.c.short}'s debt over ${sc.repay.months} months (${inr(amt / sc.repay.months * CR)} a month) saves interest gradually while keeping cash in hand.`); } }
  const monthly = sc.monthly.on ? sc.monthly : {};
  st.forEach(({ c }) => { const v = monthly[c.id] || 0; if (v) notes.push(`${v > 0 ? 'Adding' : 'Pulling out'} ${inr(Math.abs(v) * LK)} a month ${v > 0 ? 'into' : 'from'} ${c.short} changes its capital by ${inr(Math.abs(v) * 12 * LK)} a year.`); });
  if (sc.growth.on) st.forEach(({ c }) => { const v = sc.growth[c.id]; if (v != null && Math.abs(v - c.g) > 1e-6) { S[c.id].g = v; notes.push(`${c.short} growth set to ${pct(v, 0)} a year instead of ${pct(c.g, 0)}. Compounded, this changes its sales in year 5 by ${inr(S[c.id].R * (Math.pow(1 + v, 5) - Math.pow(1 + c.g, 5)) * CR)}.`); } });

  let goldReval = 0;
  st.forEach(s => {
    const { p, sales } = priceFor(s.c, sc);
    const pp = p + (shock ? (s.c.id === 'jj' ? -shock.price * 0.5 : shock.price) : 0);
    const sl = sales + (shock ? shock.sales : 0);
    if (shock) s.g += shock.g + ((shock.gNoise && shock.gNoise[s.id]) || 0);
    if (s.c.id === 'jj') { s.mar += 0.03 * pp; s.R *= (1 - 0.35 * Math.max(0, pp)); goldReval = s.inv * 0.85 * pp; s.E += goldReval; }
    else s.mar += s.c.market.sens * pp;
    s.R *= (1 + sl);
    if (!shock && sc.outside.on && (p || sales)) notes.push(`${s.c.market.label} ${p >= 0 ? 'up' : 'down'} ${Math.abs(p * 100).toFixed(0)}%${sales ? ` and sales ${sales > 0 ? 'up' : 'down'} ${Math.abs(sales * 100).toFixed(0)}%` : ''} moves ${s.c.short}'s margin by ${((s.c.id === 'jj' ? 0.03 : s.c.market.sens) * p * 100).toFixed(2)} points${s.c.id === 'jj' && p ? ` and revalues gold stock by ${inr(goldReval * CR)}` : ''}.`);
  });

  const yearly = []; let famInvest = invest, famProp = prop, famFD = fd;
  const coYear = st.map(() => []);
  let loanBal = newLoan ? newLoan.amt : 0;
  const famLiquid0 = famCash + fd;
  for (let y = 1; y <= YEARS; y++) {
    let tp = 0, interestY = 0, loanInt = 0, loanPrin = 0;
    if (newLoan) for (let k = 0; k < 12 && loanBal > 1e-9; k++) { const int = loanBal * newLoan.r / 12; const pr = Math.min(loanBal, newLoan.emi - int); loanBal -= pr; loanInt += int; loanPrin += pr; }
    st.forEach((s, idx) => {
      const mAdd = (monthly[s.id] || 0) * 12 * LK / CR;
      if (mAdd > 0) { s.K += mAdd; s.E += mAdd; famCash -= mAdd; s.ramp.push({ dR:mAdd * s.turn * 0.75, label:'monthly' }); }
      else if (mAdd < 0) { takeCap(s, -mAdd); famCash += -mAdd; }
      s.R *= (1 + s.g);
      const rampR = s.ramp.reduce((a, r) => { r.age = (r.age || 0) + 1; return a + r.dR * (r.age === 1 ? 0.5 : 1) * Math.pow(1 + s.g, r.age - 1); }, 0);
      const rev = s.R + rampR;
      let interest = s.D * s.rate, extra = interest - s.c.bs.debt * s.c.rate;
      const ownLoan = newLoan && newLoan.co === s.id;
      if (ownLoan) { interest += loanInt; extra += loanInt; }
      const book = rev * s.mar - extra;
      const prov = s.accr * Math.pow(1 + Math.max(0, s.g), y) + (y <= RULES.catchUp ? s.catchPart : 0);
      const trueP = book - prov;
      s.E += trueP * 0.55;
      famCash += trueP * 0.45;
      tp += trueP; interestY += interest;
      s.D = Math.max(0, s.D * 0.97);
      if (extraRepay && extraRepay.s === s) { const paid = Math.min(s.D, extraRepay.per * Math.max(0, Math.min(12, extraRepay.months - (y - 1) * 12))); s.D -= paid; famCash -= paid; }
      coYear[idx].push({ y, rev, book, trueP, E:s.E, D:s.D + (ownLoan ? loanBal : 0), interest, K:s.K });
    });
    if (newLoan && newLoan.co === 'fam') { famCash -= loanInt + loanPrin; interestY += loanInt; }
    famCash *= (1 + CASH_RATE); famFD *= (1 + FD_RATE); famInvest *= (1 + INV_RATE); famProp *= (1 + PROP_RATE);
    pLoans = Math.max(0, pLoans - 0.28);
    const coE = st.reduce((a, s) => a + s.E, 0);
    const famLoanBal = newLoan && newLoan.co === 'fam' ? loanBal : 0;
    const coLoanBal = newLoan && newLoan.co !== 'fam' ? loanBal : 0;
    const nw = coE + famCash + famFD + famInvest + famProp + other - pLoans - famLoanBal;
    const debt = st.reduce((a, s) => a + s.D, 0) + pLoans + famLoanBal + coLoanBal;
    const assetsTot = st.reduce((a, s) => a + s.assets + (s.K - s.c.capital), 0) + famCash + famFD + famInvest + famProp + other;
    yearly.push({ y, nw, trueProfit:tp, interest:interestY, loanInt, debt, assets:assetsTot, liquid:famCash + famFD + st.reduce((a, s) => a + s.cash, 0) });
  }
  return { st, yearly, coYear, nw0:base.nw + assetGain + goldReval, notes, newLoan, assetGain, goldReval, famLiquid0 };
}

/** Month-end family cash for the next 24 months, starting November 2026. */
export function monthlyCash(sc) {
  const base = familyTotals();
  const res = [];
  const ms = COMPANIES.map(c => metrics(c));
  let cash = base.cash;
  let oneOff = 0, emi = 0, emiMonths = 0, mAdd = 0, repayPer = 0, repayMonths = 0, extraOp = 0;
  if (sc) {
    const sim = simulate(sc);
    if (sc.invest.on) oneOff -= sc.invest.amt * LK / CR;
    if (sc.withdraw.on) oneOff += sc.withdraw.amt * LK / CR;
    if (sc.sell.on) oneOff += sc.sell.price * LK / CR;
    if (sc.loan.on && sim.newLoan) { oneOff += sc.loan.amt * LK / CR; emi = sim.newLoan.emi; emiMonths = sim.newLoan.n; }
    if (sc.repay.on) { if (sc.repay.mode === 'lump') oneOff -= sc.repay.amt * LK / CR; else { repayPer = sc.repay.amt * LK / CR / sc.repay.months; repayMonths = sc.repay.months; } }
    if (sc.loan.on && sc.loan.co !== 'fam') oneOff -= sc.loan.amt * LK / CR * 0.85;
    if (sc.monthly.on) mAdd = COMPANIES.reduce((a, c) => a + (sc.monthly[c.id] || 0), 0) * LK / CR;
    const base1 = simulate(blankScenario()).yearly[0].trueProfit;
    extraOp = (sim.yearly[0].trueProfit - base1) / 12;
  }
  const startM = 10;
  for (let k = 0; k < 24; k++) {
    const mi = (startM + k) % 12, yr = 2026 + Math.floor((startM + k) / 12);
    let op = 0;
    COMPANIES.forEach((c, i) => { const m = ms[i]; const s = c.seasonal[mi]; op += (m.ttmProfit / 12) * s + (s - 1) * c.fixedMonthly * 1.6; });
    op += 0.22 - 1.02; // add back depreciation; subtract loan repayments, family drawings and planned capex
    op += extraOp;
    let flow = op - mAdd;
    if (k === 0) flow += oneOff;
    if (emi && k < emiMonths) flow -= emi;
    if (repayPer && k < repayMonths) flow -= repayPer;
    cash += flow;
    res.push({ label:`${MON[mi]} ${String(yr).slice(2)}`, cash, flow, op:flow - (k === 0 ? oneOff : 0) });
  }
  return res;
}

export function monteCarlo(sc, runs = 200) {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const diffs = [];
  for (let r = 0; r < runs; r++) {
    const shock = { g:0, price:gauss() * 0.12, sales:gauss() * 0.04, gNoise:Object.fromEntries(COMPANIES.map(c => [c.id, gauss() * (c.id === 'jj' ? 0.04 : 0.03)])) };
    diffs.push(simulate(sc, shock).yearly[4].nw - simulate(blankScenario(), shock).yearly[4].nw);
  }
  diffs.sort((x, y) => x - y);
  return { lossChance:diffs.filter(d => d < 0).length / runs, p10:diffs[Math.floor(runs * 0.1)], p50:diffs[Math.floor(runs * 0.5)], p90:diffs[Math.floor(runs * 0.9)] };
}

export function describe(sc) {
  const d = [], name = id => (CO[id] ? CO[id].short : 'a removed business');
  if (sc.move.on) d.push(`Move ${sc.move.mode === 'pct' ? pct(sc.move.pct, 0) + ' of capital' : inr(sc.move.amt * LK)} from ${name(sc.move.from)} to ${name(sc.move.to)}`);
  if (sc.invest.on) d.push(`Invest ${inr(sc.invest.amt * LK)} in ${name(sc.invest.co)}`);
  if (sc.withdraw.on) d.push(`Withdraw ${inr(sc.withdraw.amt * LK)} from ${name(sc.withdraw.co)}`);
  if (sc.sell.on) d.push(`Sell ${SELLABLE.find(a => a.id === sc.sell.asset).n.toLowerCase()} for ${inr(sc.sell.price * LK)}`);
  if (sc.loan.on) d.push(`Borrow ${inr(sc.loan.amt * LK)} at ${pct(sc.loan.rate)} for ${sc.loan.years} years, for ${sc.loan.co === 'fam' ? 'family cash' : name(sc.loan.co)}`);
  if (sc.repay.on) d.push(`Repay ${inr(sc.repay.amt * LK)} of ${name(sc.repay.co)}'s debt ${sc.repay.mode === 'lump' ? 'in one payment' : `over ${sc.repay.months} months`}`);
  if (sc.monthly.on) COMPANIES.forEach(c => { const v = sc.monthly[c.id]; if (v) d.push(`${v > 0 ? 'Add' : 'Take out'} ${inr(Math.abs(v) * LK)} a month ${v > 0 ? 'to' : 'from'} ${c.short}`); });
  if (sc.growth.on) COMPANIES.forEach(c => { const g = sc.growth[c.id]; if (g != null && Math.abs(g - c.g) > 1e-6) d.push(`${c.short} grows ${pct(g, 0)} a year instead of ${pct(c.g, 0)}`); });
  if (sc.outside.on) [['gold', 'Gold'], ['palm', 'Edible oil'], ['jute', 'Raw jute'], ['pulp', 'Pulp'], ['sales', 'Sales']].forEach(([k, l]) => { if (sc.outside[k]) d.push(`${l} ${sc.outside[k] > 0 ? 'up' : 'down'} ${Math.abs(sc.outside[k] * 100).toFixed(0)}%`); });
  return d;
}

export function analyse(sc) {
  const s = simulate(sc), b = simulate(blankScenario()), ft = familyTotals();
  const mc = monthlyCash(sc), mcb = monthlyCash(null);
  const famLi = sc.loan.on && sc.loan.co === 'fam' ? (s.yearly[1].loanInt || 0) : 0;
  const tpD = s.yearly[1].trueProfit - b.yearly[1].trueProfit - famLi;
  const emi = s.newLoan ? s.newLoan.emi : 0;
  const obligations = ft.fixedMonthly + emi;
  const low = mc.slice(0, 12).reduce((a, x) => x.cash < a.cash ? x : a), lowB = mcb.slice(0, 12).reduce((a, x) => x.cash < a.cash ? x : a);
  const monthsLow = low.cash / obligations, monthsLowB = lowB.cash / ft.fixedMonthly;
  const warns = [];
  const neg = mc.find(x => x.cash < 0);
  if (neg) warns.push(['loss', `Cash runs out in ${neg.label}. Total cash would fall to ${inr(neg.cash * CR)}.`]);
  if (s.newLoan) {
    const miss = mc.slice(0, 24).find(x => x.cash < emi);
    if (miss) warns.push(['loss', `A loan payment of ${inr(emi * CR)} may be missed in ${miss.label}, when cash falls below one instalment.`]);
    const surplus = mcb.slice(0, 12).reduce((a, x) => a + x.flow, 0) / 12;
    if (surplus > 0 && emi > surplus * 0.6) warns.push(['warn', `Loan payments of ${inr(emi * CR)} a month take ${pct(emi / surplus, 0)} of the family's usual monthly surplus.`]);
  }
  if (!neg && monthsLow < 1) warns.push(['loss', `Cash at its lowest (${low.label}) covers under one month of running costs.`]);
  else if (!neg && monthsLow < 2) warns.push(['warn', `Cash at its lowest (${low.label}) covers only ${monthsLow.toFixed(1)} months of running costs and loan payments. Two months is a safer floor.`]);
  const Ks = s.st.map(x => x.K), Kt = Ks.reduce((a, v) => a + v, 0);
  s.st.forEach((x, i) => { if (Ks[i] / Kt > 0.4) warns.push(['warn', `Too much money in one business: ${x.c.short} would hold ${pct(Ks[i] / Kt, 0)} of all capital invested.`]); });
  const da = s.yearly[0].debt / s.yearly[0].assets; if (da > 0.45) warns.push(['warn', `Debt would be ${pct(da, 0)} of total assets.`]);
  const diffs = s.yearly.map((y, i) => y.nw - b.yearly[i].nw);
  let payback;
  if (diffs.every(d => d >= -0.005)) payback = diffs[0] > 0.005 ? 'Pays for itself in the first year' : 'No change in net worth';
  else {
    const i = diffs.findIndex((d, k) => d >= 0 && diffs.slice(k).every(x => x >= 0));
    if (i < 0) payback = 'Does not pay for itself within 10 years';
    else { const prev = i ? diffs[i - 1] : 0; const frac = i ? -prev / (diffs[i] - prev) : 0; payback = `Starts to pay for itself after about ${Math.round((i + frac) * 12)} months`; }
  }
  return { s, b, ft, mc, mcb, tpD, low, lowB, monthsLow, monthsLowB, warns, diffs, payback, obligations, emi };
}

export function scSummary(sc) { const A = analyse(sc); return { nw5:A.s.yearly[4].nw, tp:A.s.yearly[1].trueProfit, tpD:A.tpD, months:A.monthsLow, debt:A.s.yearly[0].debt, warns:A.warns.length, payback:A.payback }; }

/* ============ Advice ============ */
export function suggestions() {
  const hyg = CO.hyg, jj = CO.jj, oil = CO.oil, jute = CO.jute;
  const mh = metrics(hyg), mj = metrics(jj), mo = metrics(oil), mu = metrics(jute);
  const amtJJ = jj.capital * 0.15;
  const base = simulate(blankScenario());
  const sc1 = blankScenario(); sc1.withdraw = { on:true, co:'jj', amt:Math.round(amtJJ * 100) }; sc1.invest = { on:true, co:'hyg', amt:300 };
  const r1 = simulate(sc1);
  const sc2 = blankScenario(); sc2.repay = { on:true, co:'oil', amt:200, mode:'lump', months:12 };
  const jjStale = daysOld(DOCS.find(d => d.id === 'd11').date);
  const goldUp = mktChange('gold');
  const gratShort = mu.funds.grat.short;
  return [
    { id:'s1', kind:'Pull back', co:'jj', to:'hyg', sc:sc1,
      what:`Reduce capital in JJ Jewelers by 15% (${inr(amtJJ * CR)}) and put ${inr(3 * CR)} of it into Himgiri Hygiene`,
      inside:[
        `JJ's margin fell from ${jj.mar[3]}% to ${jj.mar[7]}% in four quarters while debt rose ${pct(mj.debtChange, 0)} to ${inr(jj.bs.debt * CR)}.`,
        `Stock takes ${jj.invDays[7]} days to sell, up from ${jj.invDays[3]}. ${inr(jj.bs.inventory * CR)} sits in jewellery that earns ${pct(mj.trueRoce)} after provisions.`,
        `Himgiri Hygiene earns ${pct(mh.trueRoce)} on its capital after provisions, with sales up ${pct(mh.revGrowth)} and debt down ${pct(-mh.debtChange, 0)}.`,
      ],
      outside:[
        `Gold is up ${pct(goldUp, 0)} in a year. Selling slow stock now locks in that gain before any correction.`,
        'Higher gold prices are pushing wedding buyers to lighter pieces, which cuts the value of each sale.',
        `Fluff pulp, Himgiri's main input, is down ${pct(-mktChange('pulp'), 1)} in a year, and packaged hygiene demand is rising in smaller towns.`,
      ],
      money:`${inr(amtJJ * CR)} released by selling the slowest-moving quarter of JJ's gold stock and cutting its gold loan. ${inr(3 * CR)} goes to a second diaper line at the Siliguri unit. The remaining ${inr((amtJJ - 3) * CR)} can close Bengal Jute's gratuity shortfall.`,
      effect:`True profit rises by about ${inr((r1.yearly[1].trueProfit - base.yearly[1].trueProfit) * CR)} a year by year 2, and family net worth is about ${inr((r1.yearly[4].nw - base.yearly[4].nw) * CR)} higher after 5 years.`,
      risk:`If nothing changes, JJ's interest bill (${inr(mj.interest * CR)} a year) keeps growing faster than its profit, and a 10% fall in gold would cut stock value by about ${inr(jj.bs.inventory * 0.85 * 0.1 * CR)}.`,
      conf:0.72, used:['d10', 'd11', 'd12', 'd1', 'd2'], gaps:[`JJ's stock register is ${jjStale} days old (last updated ${fmtDate('2026-07-27')}). Current stock may differ.`, 'Gold, pulp and other market prices here are sample figures until a live price feed is connected.'] },
    { id:'s2', kind:'Hold', co:'oil', sc:sc2,
      what:`Hold capital in Eastern Edible Oils and repay ${inr(2 * CR)} of its working-capital loan from family fixed deposits`,
      inside:[
        `Sales are steady at ${inr(mo.ttmRev * CR)} a year, but margin slipped from ${oil.mar[3]}% to ${oil.mar[7]}%.`,
        `Debt of ${inr(oil.bs.debt * CR)} costs ${pct(oil.rate)} a year, while family fixed deposits earn ${pct(FD_RATE)}.`,
        `Cash covers only ${mo.months.toFixed(1)} months of running costs. ${(oil.topCust * 100).toFixed(0)}% of sales go to one modern trade chain.`,
      ],
      outside:[
        `Crude palm oil is up ${pct(mktChange('palm', 5), 1)} in six months, and price rises reach buyers about a quarter later.`,
        'Import duty on crude edible oil can change at short notice.',
      ],
      money:`${inr(2 * CR)} moves from family fixed deposits to repay the costliest part of the oil company's bank loan. No new capital goes in until margins recover.`,
      effect:`Saves about ${inr(2 * (oil.rate - FD_RATE) * CR)} a year net of lost deposit interest, and lowers the company's debt to ${inr((oil.bs.debt - 2) * CR)}.`,
      risk:'If palm oil keeps rising and margins fall below 3%, interest would take more than half of book profit.',
      conf:0.66, used:['d4', 'd5', 'd6', 'd15'], gaps:['September ledger entries after 25 September are not yet imported.'] },
    { id:'s3', kind:'Hold', co:'jute', sc:null,
      what:`Hold capital in Bengal Jute Mills and fund its ${inr(gratShort * CR)} gratuity shortfall before adding money`,
      inside:[
        `Book profit is ${inr(mu.ttmProfit * CR)}, but after its share of staff obligations true profit is only ${inr(mu.trueProfit * CR)}.`,
        `${jute.staff} workers average ${jute.years} years of service, so gratuity owed is ${inr(mu.funds.grat.need * CR)} against ${inr(mu.funds.grat.set * CR)} set aside.`,
        `Debt has fallen ${pct(-mu.debtChange, 0)} and margin improved to ${jute.mar[7]}%.`,
      ],
      outside:[
        `Raw jute has dropped ${pct(-(MARKET.jute.s[11] / 7200 - 1), 0)} from its August peak as the new crop arrives, which helps margins this season.`,
        `${(jute.topCust * 100).toFixed(0)}% of sales depend on government sacking orders, which are steady but set by one buyer.`,
      ],
      money:`${inr(gratShort * CR)} set aside over 12 months, from the money released at JJ Jewelers or from the mill's own cash flow.`,
      effect:"Removes the largest unfunded staff obligation in the group, so the mill's reported profit can be trusted when deciding on future investment.",
      risk:'If several long-serving workers retire together, the mill would need to pay gratuity from working capital at short notice.',
      conf:0.81, used:['d7', 'd9', 'd13'], gaps:[] },
  ];
}
export function suggestedScenario() { const sc = blankScenario(); sc.withdraw = { on:true, co:'jj', amt:480 }; sc.invest = { on:true, co:'hyg', amt:300 }; sc.repay = { on:true, co:'oil', amt:200, mode:'lump', months:12 }; return sc; }

/* ============ Alerts, cash parts, bulk buying ============ */
export function alertsList() {
  const mo = metrics(CO.oil), mj = metrics(CO.jj), mu = metrics(CO.jute);
  return [
    { s:'loss', t:'Low cash at JJ Jewelers', d:`Cash of ${inr(CO.jj.bs.cash * CR)} covers ${mj.months.toFixed(1)} months of running costs, below the 2-month floor.`, w:'Today', type:'Low cash' },
    { s:'loss', t:'Debt rising at JJ Jewelers', d:`Borrowings up ${pct(mj.debtChange, 0)} in a year to ${inr(CO.jj.bs.debt * CR)}, while sales fell ${pct(-mj.revGrowth, 0)}.`, w:'Q2 FY27', type:'Rising debt' },
    { s:'warn', t:'Crude palm oil stock running low at Haldia', d:'9 days of use left against a reorder level of 14 days (stock register, row 188).', w:'3 Oct', type:'Low stock' },
    { s:'warn', t:'Unusual power bill at Guwahati unit', d:'September power cost ₹18.4 L against a three-month average of ₹11.2 L (+64%).', w:'30 Sep', type:'Unusual expense' },
    { s:'warn', t:'Crude palm oil price up sharply', d:`Up ${pct(mktChange('palm', 5), 1)} in six months. Eastern Edible Oils has about one quarter before it can pass this on.`, w:'This month', type:'Raw material price' },
    { s:'warn', t:'Cash covers under two months at Eastern Edible Oils', d:`${mo.months.toFixed(1)} months of running costs in hand.`, w:'Today', type:'Low cash' },
    { s:'loss', t:'Gratuity shortfall at Bengal Jute Mills', d:`${inr(mu.funds.grat.short * CR)} owed to long-serving workers is not set aside.`, w:'Today', type:'Unfunded obligation' },
    { s:'gain', t:'Raw jute price falling', d:`Down ${pct(1 - MARKET.jute.s[11] / 7200, 0)} from the August peak as the new crop arrives. A good window to buy in bulk.`, w:'This month', type:'Raw material price' },
    { s:'info', t:'JJ stock register is out of date', d:`Last imported ${fmtDate('2026-07-27')}, ${daysOld('2026-07-27')} days before the sample data date. Stock-related advice may be off.`, w:'Data', type:'Stale data' },
  ];
}

export function cashParts() {
  const inflow = [], outflow = [];
  let raw = 0, sal = 0, int = 0, oth = 0;
  COMPANIES.forEach(c => {
    const m = metrics(c); inflow.push([`Sales collections, ${c.short}`, m.ttmRev / 12, c.id]);
    const costs = m.ttmRev - m.ttmProfit, s = c.staff * c.basic * 1.65 * 12 / CR, i = m.interest, r = Math.max(0, (costs - s - i) * c.rawDep);
    raw += r; sal += s; int += i; oth += Math.max(0, costs - s - i - r);
  });
  inflow.push(['Investment income and interest', 0.11, 'fam']);
  outflow.push(['Raw materials and stock', raw / 12], ['Salaries and wages', sal / 12], ['Power, freight and other running costs', oth / 12], ['Interest on loans', int / 12], ['Taxes', 0.31], ['Loan repayments and family drawings', 0.52]);
  return { inflow, outflow };
}

export function bulkItems() {
  return [
    { k:'jute', co:'jute', verdict:'Buy in bulk now', tone:'growing', qty:'Three months of raw jute, about 9,500 quintals', cash:5.85,
      trend:`Raw jute is down ${pct(1 - MARKET.jute.s[11] / 7200, 0)} from its August peak as the new crop arrives. In the last two seasons prices bottomed in November and December and rose 12% to 20% by the following July.`,
      cost:'Storage and insurance about 0.8% a month, plus 10% a year on the money tied up. Holding three months costs about 4.9% of the purchase.',
      math:'Buying ahead pays off if prices rise more than 4.9% over three months. A typical seasonal rise is three to four times that.' },
    { k:'palm', co:'oil', verdict:'Buy one month ahead only', tone:'stable', qty:'One month of crude palm oil, about 2,400 tonnes', cash:2.9,
      trend:`Crude palm oil is up ${pct(mktChange('palm', 5), 1)} in six months and still rising. Locking in one month protects the margin while price rises are passed to buyers.`,
      cost:'Tank storage is full above five weeks of stock, and oil loses quality after about 60 days. Cash cost is 10.2% a year on the cash credit line.',
      math:`One month ahead costs about 1.1%. Going longer would need extra tanks and cash the company does not have (it holds ${metrics(CO.oil).months.toFixed(1)} months of running costs).` },
    { k:'pulp', co:'hyg', verdict:'Keep buying monthly', tone:'neutral', qty:'Normal monthly orders', cash:0,
      trend:`Fluff pulp has fallen ${pct(-mktChange('pulp'), 1)} in a year and is still easing. Buying early would mean paying more than next month's likely price.`,
      cost:'Warehouse space at Siliguri is already tight.', math:'No saving expected from buying ahead while the price trend is down.' },
    { k:'gold', co:'jj', verdict:'Do not add stock', tone:'risk', qty:'Buy only against confirmed orders', cash:0,
      trend:`Gold is up ${pct(mktChange('gold'), 0)} in a year. JJ already holds ${inr(CO.jj.bs.inventory * CR)} of stock that takes ${CO.jj.invDays[7]} days to sell.`,
      cost:`Each extra ₹1 Cr of gold costs about ${inr((CO.jj.rate + 0.01) * CR)} a year to hold.`, math:'Use the gold metal loan for wedding orders instead of buying stock outright.' },
  ];
}

/* ============ Reports ============ */
export const REPORTS = [
  ['position', 'Family financial position', 'Net worth, cash, assets and liabilities across the family'],
  ['business', 'Business performance', 'Sales, profit, true profit, return and outlook for each business'],
  ['reserves', 'Reserves and true profit', 'Every fund, what is needed, what is set aside and the gap'],
  ['assets', 'Assets and liabilities', 'All holdings and loans with rates and renewal dates'],
  ['cash', 'Cash flow', 'Money in and out, and the 12-month cash outlook'],
  ['investments', 'Investments', 'Holdings, returns and mix'],
  ['forecast', 'Forecast', 'Five-year projection on history-based growth'],
  ['advice', 'Reallocation advice', 'All suggestions with reasons, effect and confidence'],
];

export function reportText(k) {
  const ft = familyTotals(), L = [], hr = '-'.repeat(56);
  L.push('MERIDIAN · Mundara family office', REPORTS.find(r => r[0] === k)[1].toUpperCase(), `Prepared ${fmtDate(DATA_AS_OF)} from sample figures to 30 September 2026`, hr);
  if (k === 'position') {
    L.push(`Net worth            ${inr(ft.nw * CR)}`, `Total assets         ${inr(ft.assets * CR)}`, `Total liabilities    ${inr(ft.liab * CR)}`, `Cash                 ${inr(ft.cash * CR)}  (${(ft.cash / ft.fixedMonthly).toFixed(1)} months of running costs)`, '', 'Net worth by business');
    COMPANIES.forEach(c => L.push(`  ${c.short.padEnd(22)} ${inr(metrics(c).equity * CR)}`));
    L.push(`  ${'Family holdings'.padEnd(22)} ${inr((ft.personalAssets - ft.personalLiab) * CR)}`);
  }
  if (k === 'business' || k === 'reserves') COMPANIES.forEach(c => {
    const m = metrics(c), o = outlook(c, m);
    L.push(c.name, `  Outlook: ${o.label}`, `  Sales ${inr(m.ttmRev * CR)}, book profit ${inr(m.ttmProfit * CR)}, true net profit ${inr(m.trueProfit * CR)}`, `  Return on capital after provisions ${pct(m.trueRoce)}`);
    if (k === 'business') o.inside.concat(o.outside).forEach(x => L.push('  - ' + x));
    else Object.entries(m.funds).forEach(([f, x]) => L.push(`  ${FUND_META[f].n.padEnd(30)} needed ${inr(x.need * CR).padEnd(11)} set aside ${inr(x.set * CR).padEnd(11)} ${x.short > 0 ? 'short ' + inr(x.short * CR) : 'funded'}`));
    L.push('');
  });
  if (k === 'reserves') L.push('Default rules are estimates. Final treatment must follow applicable accounting standards, tax rules and labour laws, confirmed by a qualified accountant.');
  if (k === 'assets') { L.push('Loans'); LENDERS.forEach(l => L.push(`  ${l.n.padEnd(36)} ${inr(l.amt * CR).padEnd(11)} ${pct(l.rate)}  ${l.due}`)); L.push('', 'Family holdings'); FAMILY.investments.concat(FAMILY.property).forEach(x => L.push(`  ${x.n.padEnd(36)} ${inr(x.val * CR)}`)); }
  if (k === 'cash') { const { inflow, outflow } = cashParts(); L.push('A typical month'); inflow.forEach(([n, v]) => L.push(`  + ${n.padEnd(42)} ${inr(v * CR)}`)); outflow.forEach(([n, v]) => L.push(`  - ${n.padEnd(42)} ${inr(v * CR)}`)); L.push('', 'Cash at month end'); monthlyCash(null).slice(0, 12).forEach(m => L.push(`  ${m.label.padEnd(8)} ${inr(m.cash * CR)}`)); }
  if (k === 'investments') FAMILY.investments.forEach(x => L.push(`  ${x.n.padEnd(28)} invested ${inr(x.inv * CR).padEnd(11)} now ${inr(x.val * CR).padEnd(11)} 12-month return ${pct(x.ret1y)}`));
  if (k === 'forecast') simulate(blankScenario()).yearly.slice(0, 5).forEach((y, i) => L.push(`  Year ${i + 1}: net worth ${inr(y.nw * CR)}, true profit ${inr(y.trueProfit * CR)}, debt ${inr(y.debt * CR)}`));
  if (k === 'advice') suggestions().forEach((s, i) => L.push(`${i + 1}. ${s.what}`, '   Inside the business:', ...s.inside.map(x => '   - ' + x), '   Outside the business:', ...s.outside.map(x => '   - ' + x), `   Money: ${s.money}`, `   If followed: ${s.effect}`, `   If not: ${s.risk}`, `   Confidence ${Math.round(s.conf * 100)}%`, ''));
  L.push(hr, "These are suggestions to support the family's decisions, not instructions. All figures are sample data.");
  return L.join('\n');
}

export function scenarioReport(name, sc) {
  const A = analyse(sc), { s, b } = A, d = describe(sc), hr = '-'.repeat(56);
  const best = simulate(sc, { ...sc.cases.best }), worst = simulate(sc, { ...sc.cases.worst });
  return ['MERIDIAN · What If scenario', name.toUpperCase(), `Prepared ${fmtDate(DATA_AS_OF)} from sample figures`, hr, 'Changes tested', ...d.map(x => '  - ' + x), '',
    'Result', `  True profit a year (year 2): ${inr(b.yearly[1].trueProfit * CR)} -> ${inr(s.yearly[1].trueProfit * CR)} (${A.tpD >= 0 ? '+' : '−'}${inr(Math.abs(A.tpD) * CR)})`,
    `  Net worth in 5 years: ${inr(b.yearly[4].nw * CR)} -> ${inr(s.yearly[4].nw * CR)}`, `  Net worth in 10 years: ${inr(b.yearly[9].nw * CR)} -> ${inr(s.yearly[9].nw * CR)}`,
    `  Lowest cash in next 12 months: ${inr(A.low.cash * CR)} (${A.monthsLow.toFixed(1)} months of costs) in ${A.low.label}`, `  Debt after 1 year: ${inr(s.yearly[0].debt * CR)}`, `  ${A.payback}`, '',
    'Three cases (net worth in 5 years)', `  Best ${inr(best.yearly[4].nw * CR)} · Expected ${inr(s.yearly[4].nw * CR)} · Worst ${inr(worst.yearly[4].nw * CR)}`, '',
    'Warnings', ...(A.warns.length ? A.warns.map(([, w]) => '  ! ' + w) : ['  None']), '', 'Why the numbers changed', ...s.notes.map(n => '  - ' + n), hr,
    'Results use true net profit after reserves and provisions. These are projections to support a decision, not a guarantee.'].join('\n');
}

/* ============ Data import: sorting files to company, unit and type ============ */
const KW = { hyg:['himgiri', 'hygiene', 'hhl', 'diaper', 'sanitary', 'wipes'], oil:['oil', 'eeo', 'refin', 'palm', 'edible', 'haldia'], jute:['jute', 'bjm', 'titagarh', 'naihati', 'hessian', 'sacking'], jj:['jj', 'jewel', 'gold', 'ornament', 'diamond', 'karat', 'park street', 'showroom'] };
const UNIT_KW = { hyg:[['siliguri', 'Siliguri unit'], ['guwahati', 'Guwahati unit'], ['warehouse', 'Kolkata warehouse']], oil:[['haldia', 'Haldia refinery'], ['pack', 'Kolkata packing unit']], jute:[['titagarh', 'Titagarh mill'], ['naihati', 'Naihati mill']], jj:[['park', 'Park Street showroom'], ['siliguri', 'Siliguri showroom'], ['workshop', 'Kolkata workshop'], ['karigar', 'Kolkata workshop']] };
export const DOC_TYPES = ['Balance sheet', 'Profit and loss', 'Ledger', 'Stock register', 'Cash book', 'Staff register', 'Asset register', 'Investment statement'];
export function classify(name, text) {
  const s = (name + ' ' + text).toLowerCase(); let co = null, best = 0;
  for (const [k, ws] of Object.entries(KW)) { const n = ws.filter(w => s.includes(w)).length; if (n > best) { best = n; co = k; } }
  for (const c of COMPANIES.filter(x => x.custom)) { const n = c.name.toLowerCase().split(/\s+/).filter(w => w.length > 3 && s.includes(w)).length; if (n > best) { best = n; co = c.id; } }
  let unit = 'All units'; if (co && UNIT_KW[co]) for (const [w, u] of UNIT_KW[co]) if (s.includes(w)) { unit = u; break; }
  const T = [['Balance sheet', ['balance sheet', 'liabilities', 'assets', 'capital account', 'reserves and surplus']], ['Profit and loss', ['profit', 'loss', 'p&l', 'pnl', 'income', 'expenditure', 'revenue']], ['Stock register', ['stock', 'qty', 'quantity', 'item', 'opening stock', 'closing stock', 'grams', 'weight']], ['Cash book', ['cash book', 'cashbook', 'receipt', 'payment', 'voucher']], ['Ledger', ['ledger', 'debit', 'credit', 'narration', 'dr', 'cr']], ['Staff register', ['employee', 'wages', 'salary', 'staff', 'basic pay', 'uan']], ['Asset register', ['asset register', 'depreciation', 'useful life']], ['Investment statement', ['folio', 'nav', 'units held', 'fixed deposit', 'demat']]];
  let type = 'Ledger', tb = 0; for (const [t, ws] of T) { const n = ws.filter(w => s.includes(w)).length; if (n > tb) { tb = n; type = t; } }
  return { co:co || 'fam', unit, type, conf:Math.min(0.95, 0.35 + best * 0.2 + tb * 0.1) };
}
export function parseCSV(text) {
  return text.split(/\r?\n/).filter(l => l.trim()).map(l => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; });
}

/* ============ Businesses added by the user (up to 15 in total) ============ */
export const MAX_COS = 15;
export const PALETTE = ['#7A4E9C', '#2F7D4E', '#3A7CA5', '#C0602B', '#9C3D5A', '#5B5EA6', '#8C6D1F', '#A23E48', '#2E6F8E', '#4F5D2F', '#6B4F3A', '#B0487F', '#3F8F8A', '#8A5A2B', '#4A6FA5'];
const MKT_SENS = { gold:0.03, palm:-0.12, crude:-0.08, jute:-0.1, pulp:-0.09 };

export function buildCompany(f) {
  const sales = f.sales, q = sales / 4, g = f.growth, col = f.color, id = f.id;
  return { id, custom:true, input:f, name:f.name, short:f.name, industry:f.industry || 'Business',
    theme:{ main:col, bright:mixHex(col, '#ffffff', 0.35), deep:mixHex(col, '#000000', 0.62), deepD:mixHex(col, '#000000', 0.78), tintL:mixHex(col, '#ffffff', 0.92), tintD:mixHex(col, '#000000', 0.86), mainD:mixHex(col, '#ffffff', 0.25) },
    bsDoc:'doc_' + id, plDoc:'doc_' + id,
    rev:Array.from({ length:8 }, (_, i) => +(q * Math.pow(1 + g, (i - 5.5) / 4)).toFixed(3)),
    mar:Array(8).fill(f.margin), debtHist:Array(8).fill(f.debt), invDays:Array(8).fill(60),
    capital:f.capital, g, rate:0.10,
    bs:{ cash:f.cash, receivables:sales * 0.12, inventory:sales * 0.15, plant:f.capital * 0.45, land:f.capital * 0.2, other:f.capital * 0.03, debt:f.debt, payables:sales * 0.08, advances:0, otherL:sales * 0.02 },
    fixedMonthly:Math.max(0.03, sales * (1 - f.margin / 100) * 0.3 / 12), cashDays:60, rawDep:0.5, rawName:f.raw || 'Raw material', topCust:0.2, topCustName:'Largest buyer',
    staff:f.staff, basic:15000, years:5, leaveDays:10, pfMonths:1, pendingPay:f.staff * 15000 * 0.1 / CR,
    aging:[0.6, 0.25, 0.1, 0.05].map(x => x * sales * 0.12),
    assets:[{ n:'Plant and machinery', cost:f.capital * 0.45, age:5, life:15 }, { n:'Buildings', cost:f.capital * 0.2, age:10, life:40 }],
    stockLoss:0.03, contingencies:[], set:{ grat:0, pf:0, bonus:0, leave:0, pay:0, cont:0, bad:0, repl:0, stock:0, emer:0 },
    market:{ key:f.market, sens:MKT_SENS[f.market] ?? -0.08, label:MARKET[f.market].n + ' price' },
    seasonal:Array(12).fill(1),
    factories:[{ n:'Main unit', what:f.industry || 'Operations', rev:1, staff:f.staff, doc:'doc_' + id }] };
}

export function registerCompany(c) {
  COMPANIES.push(c); CO[c.id] = c;
  RULES.stockLoss[c.id] = 0.03; DEFAULT_RULES.stockLoss[c.id] = 0.03;
  document.documentElement.style.setProperty('--c-' + c.id, c.theme.main);
  DOCS.push({ id:'doc_' + c.id, file:`${c.short.replace(/[^A-Za-z0-9]+/g, '_')}_Figures_Entered.xlsx`, co:c.id, unit:'All units', type:'Balance sheet', date:c.input.added || DATA_AS_OF, rows:40 });
  if (c.bs.debt > 0) LENDERS.push({ co:c.id, n:'Bank borrowings (entered by hand)', amt:c.bs.debt, rate:c.rate, due:'Not entered yet', emi:0 });
  const f = funds(c); Object.keys(f).forEach(k => { c.set[k] = +(f[k].need * 0.6).toFixed(3); });
}

export function unregisterCompany(id) {
  const rm = (arr, fn) => { for (let i = arr.length - 1; i >= 0; i--) if (fn(arr[i])) arr.splice(i, 1); };
  rm(COMPANIES, c => c.id === id); rm(DOCS, d => d.co === id); rm(LENDERS, l => l.co === id);
  delete CO[id]; delete RULES.stockLoss[id]; delete DEFAULT_RULES.stockLoss[id];
  Object.keys(OVERRIDES).forEach(k => { if (k.startsWith(id + '.')) delete OVERRIDES[k]; });
  document.documentElement.style.removeProperty('--c-' + id);
}

export const saveExtra = () => store.set('extraCos', COMPANIES.filter(c => c.custom).map(c => c.input));
export function loadExtra() {
  const list = store.get('extraCos', []);
  (Array.isArray(list) ? list : []).slice(0, MAX_COS - 4).forEach(f => {
    try { if (f && f.id && f.name && MARKET[f.market] && !CO[f.id]) registerCompany(buildCompany(f)); } catch { /* skip bad entry */ }
  });
}

/** Sanitises a scenario loaded from storage so it only references businesses that still exist. */
export function fixScenario(sc) {
  const b = blankScenario(), out = { ...b, ...sc };
  ['move', 'invest', 'withdraw', 'sell', 'loan', 'repay', 'outside', 'cases'].forEach(k => { out[k] = { ...b[k], ...(sc[k] || {}) }; });
  out.monthly = { ...b.monthly, ...(sc.monthly || {}) }; out.growth = { ...b.growth, ...(sc.growth || {}) };
  const ok = id => !!CO[id];
  if (!ok(out.move.from)) out.move.from = 'jj'; if (!ok(out.move.to)) out.move.to = 'hyg';
  ['invest', 'withdraw', 'repay'].forEach(k => { if (!ok(out[k].co)) out[k].co = 'hyg'; });
  if (out.loan.co !== 'fam' && !ok(out.loan.co)) out.loan.co = 'hyg';
  return out;
}
