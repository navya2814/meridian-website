// Assets, Liabilities, Cash Flow and Investments pages.
import { useState } from 'react';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { Callout, Card, CoDot, Delta, HBar, Kpi, PageHead, Seg, Trace } from '../components/ui.jsx';
import { COMPANIES, CO, FAMILY, LENDERS, MONTHS12, QTRS } from '../lib/data.js';
import { CR, inr, pct, cssv, coC, alpha } from '../lib/format.js';
import { baseOpts, hBarOpts } from '../lib/charts.js';
import { bsRow, cashParts, famRow, familyTotals, metrics, monthlyCash, traceFor } from '../lib/engine.js';

/* ---------------- Assets ---------------- */
export function Assets() {
  const ft = familyTotals();
  const [owner, setOwner] = useState('all');
  const sumBs = k => COMPANIES.reduce((s, c) => s + c.bs[k], 0);
  const cats = [
    ['Business stock', sumBs('inventory')], ['Plant and machinery', sumBs('plant')], ['Property, land and buildings', sumBs('land') + ft.prop],
    ['Investments', ft.inv], ['Due from customers', sumBs('receivables')], ['Cash', ft.cash], ['Gold held by the family', FAMILY.gold],
    ['Vehicles and other', FAMILY.vehicles + sumBs('other')],
  ].sort((a, b) => b[1] - a[1]);
  const rows = [];
  COMPANIES.forEach(c => [['inventory', 'Stock'], ['plant', 'Plant and machinery'], ['land', 'Land and buildings'], ['receivables', 'Due from customers'], ['cash', 'Cash and bank']]
    .forEach(([k, l]) => rows.push({ n: l, owner: c.short, id: c.id, v: c.bs[k], tr: [bsRow(c, k, l.toLowerCase())] })));
  FAMILY.property.forEach(p => rows.push({ n: p.n, owner: 'Family', id: 'fam', v: p.val, tr: [famRow(p.n, p.val, p.row)] }));
  FAMILY.investments.forEach(p => rows.push({ n: p.n, owner: 'Family', id: 'fam', v: p.val, tr: [famRow(p.n, p.val, p.row)] }));
  rows.push({ n: 'Physical gold', owner: 'Family', id: 'fam', v: FAMILY.gold, tr: [famRow('Physical gold', FAMILY.gold, 35)] },
    { n: 'Savings accounts', owner: 'Family', id: 'fam', v: FAMILY.cash, tr: [famRow('Savings accounts', FAMILY.cash, 4)] },
    { n: 'Vehicles', owner: 'Family', id: 'fam', v: FAMILY.vehicles, tr: [famRow('Vehicles', FAMILY.vehicles, 34)] });
  rows.sort((a, b) => b.v - a.v);
  const shown = owner === 'all' ? rows : rows.filter(r => r.id === owner);
  const stockAll = sumBs('inventory');
  const t = traceFor('assets');
  return (
    <>
      <PageHead title="Assets" sub="Everything the family owns, inside and outside the businesses.">
        <Kpi label="Total assets" value={<Trace {...t}>{inr(ft.assets * CR)}</Trace>} />
      </PageHead>
      <div className="grid g-side">
        <Card title="By type" hint={`Where the family's ${inr(ft.assets * CR)} sits`}>
          <HBar max={cats[0][1]} rows={cats.map(([n, v]) => ({ n, v, label: inr(v * CR), sub: pct(v / ft.assets, 0) }))} />
          {CO.jj && <Callout style={{ marginTop: 16 }}>{pct(stockAll / ft.assets, 0)} of everything the family owns is business stock, and {pct(CO.jj.bs.inventory / stockAll, 0)} of that stock is jewellery at JJ Jewelers.</Callout>}
        </Card>
        <Card title="By owner" hint="Assets held by each business and by the family directly">
          <ChartCanvas label="Assets by owner" build={() => {
            const ids = [...COMPANIES.map(c => c.id), 'fam'];
            return { type: 'bar', data: { labels: [...COMPANIES.map(c => c.short), 'Family'], datasets: [{ label: 'Assets', data: [...COMPANIES.map(c => metrics(c).assets), ft.personalAssets], backgroundColor: ids.map(coC), borderRadius: 5, maxBarThickness: 28 }] }, options: hBarOpts() };
          }} />
        </Card>
      </div>
      <Card title="All holdings" hint="Largest first. Select an amount to see its source row." bodyClass="card-b tbl-wrap"
        actions={<label className="row small" style={{ gap: 8 }}>Held by
          <select className="input" style={{ width: 'auto' }} value={owner} onChange={e => setOwner(e.target.value)}>
            <option value="all">Everyone</option>{COMPANIES.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}<option value="fam">Family</option>
          </select></label>}>
        <table className="tbl">
          <thead><tr><th>Asset</th><th>Held by</th><th className="r">Value</th><th className="r">Share of total</th></tr></thead>
          <tbody>{shown.map(r => (
            <tr key={r.owner + r.n}><td>{r.n}</td><td><span className="row" style={{ gap: 7, flexWrap: 'nowrap' }}><CoDot id={r.id} />{r.owner}</span></td>
              <td className="r"><Trace label={`${r.owner}: ${r.n}`} value={r.v * CR} rows={r.tr}>{inr(r.v * CR)}</Trace></td><td className="r">{pct(r.v / ft.assets, 1)}</td></tr>
          ))}</tbody>
        </table>
      </Card>
    </>
  );
}

/* ---------------- Liabilities ---------------- */
const UPCOMING = [
  ['warn', 'ICICI cash credit renewal, JJ Jewelers', '₹10.0 Cr limit due for renewal in December. The bank will review stock days, now 318.', 'Dec 2026'],
  ['info', 'SBI cash credit renewal, Eastern Edible Oils', '₹9.8 Cr limit. Margin trend will be part of the review.', 'Jan 2027'],
  ['info', 'Gold metal loan rollover, JJ Jewelers', '₹7.5 Cr rolls over every 180 days at the current gold price.', 'Jan 2027'],
  ['gain', 'Term loan, UCO Bank, Bengal Jute Mills', 'Quarterly payment of ₹48 L on schedule.', '31 Dec 2026'],
];
export function Liabilities() {
  const ft = familyTotals();
  const [by, setBy] = useState('all');
  const debt = LENDERS.reduce((s, l) => s + l.amt, 0);
  const pay = COMPANIES.reduce((s, c) => s + c.bs.payables, 0), adv = COMPANIES.reduce((s, c) => s + c.bs.advances, 0);
  const interest = LENDERS.reduce((s, l) => s + l.amt * l.rate, 0);
  const loans = by === 'all' ? LENDERS : LENDERS.filter(l => l.co === by);
  const t = traceFor('liab');
  return (
    <>
      <PageHead title="Liabilities" sub="Loans, money owed to suppliers and other obligations." />
      <div className="grid g4">
        <Kpi label="Total liabilities" value={<Trace {...t}>{inr(ft.liab * CR)}</Trace>} foot={<span>{pct(ft.liab / ft.assets, 0)} of total assets</span>} />
        <Kpi label="Bank borrowings" value={inr(debt * CR)} foot={<><Delta x={COMPANIES.reduce((s, c) => s + c.debtHist[7] - c.debtHist[3], 0) * CR} invert /><span>in a year</span></>} />
        <Kpi label="Interest a year" value={inr(interest * CR)} foot={<span>average rate {pct(interest / debt)}</span>} />
        <Kpi label="Owed to suppliers" value={inr(pay * CR)} foot={<span>plus {inr(adv * CR)} customer advances</span>} />
      </div>
      <div className="grid g-main">
        <Card title="Borrowings by business" hint="Last eight quarters, ₹ crore">
          <ChartCanvas label="Borrowings by business" build={() => ({ type: 'bar', data: { labels: QTRS, datasets: COMPANIES.map(c => ({ label: c.short, data: c.debtHist, backgroundColor: coC(c.id), borderRadius: 3, maxBarThickness: 34 })) }, options: baseOpts({ legend: true, stacked: true }) })} />
        </Card>
        <Card title="Coming up" hint="Renewals and large payments in the next 90 days">
          <div className="list">{UPCOMING.map(([s, t2, d, w]) => <div className="list-row" key={t2}><span className={`sev ${s}`} /><div><div className="t">{t2}</div><div className="d">{d}</div></div><span className="when">{w}</span></div>)}</div>
        </Card>
      </div>
      <Card title="All loans" bodyClass="card-b tbl-wrap"
        actions={<label className="row small" style={{ gap: 8 }}>Borrower
          <select className="input" style={{ width: 'auto' }} value={by} onChange={e => setBy(e.target.value)}>
            <option value="all">Everyone</option>{COMPANIES.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}<option value="fam">Family</option>
          </select></label>}>
        <table className="tbl">
          <thead><tr><th>Loan</th><th>Borrower</th><th className="r">Outstanding</th><th className="r">Rate</th><th className="r">Interest a year</th><th className="r">Monthly payment</th><th>Ends or renews</th></tr></thead>
          <tbody>{loans.map(l => (
            <tr key={l.co + l.n}><td>{l.n}</td><td><span className="row" style={{ gap: 7, flexWrap: 'nowrap' }}><CoDot id={l.co} />{l.co === 'fam' ? 'Family' : CO[l.co].short}</span></td>
              <td className="r">{inr(l.amt * CR)}</td><td className="r">{pct(l.rate)}</td><td className="r">{inr(l.amt * l.rate * CR)}</td>
              <td className="r">{l.emi ? inr(l.emi * CR) : <span className="t-muted">Interest only</span>}</td><td className="t-muted">{l.due}</td></tr>
          ))}</tbody>
          <tfoot><tr><td>Total</td><td /><td className="r">{inr(loans.reduce((s, l) => s + l.amt, 0) * CR)}</td><td /><td className="r">{inr(loans.reduce((s, l) => s + l.amt * l.rate, 0) * CR)}</td><td className="r">{inr(loans.reduce((s, l) => s + l.emi, 0) * CR)}</td><td /></tr></tfoot>
        </table>
      </Card>
    </>
  );
}

/* ---------------- Cash flow ---------------- */
export function CashChart({ mc, mcb, label = 'Cash by month' }) {
  return (
    <ChartCanvas label={label} deps={[JSON.stringify(mc.map(m => m.cash.toFixed(3))), mcb ? mcb.length : 0]} build={() => {
      const thr = familyTotals().fixedMonthly;
      const col = mc.map(m => (m.cash < 0 ? cssv('--loss') : m.cash < thr ? cssv('--warn') : alpha(cssv('--accent'), 0.8)));
      const ds = [{ type: 'bar', label: 'Cash with this plan', data: mc.map(m => m.cash), backgroundColor: col, borderRadius: 4, maxBarThickness: 26, order: 2 }];
      if (mcb) ds.push({ type: 'line', label: 'Cash without change', data: mcb.map(m => m.cash), borderColor: cssv('--muted'), borderDash: [5, 4], pointRadius: 0, borderWidth: 1.6, order: 1 });
      ds.push({ type: 'line', label: 'One month of running costs', data: mc.map(() => thr), borderColor: cssv('--warn'), borderWidth: 1, pointRadius: 0, borderDash: [2, 3], order: 0 });
      return { data: { labels: mc.map(m => m.label), datasets: ds }, options: baseOpts({ legend: true }) };
    }} />
  );
}

export function CashFlow() {
  const [months, setMonths] = useState(12);
  const { inflow, outflow } = cashParts();
  const tin = inflow.reduce((s, x) => s + x[1], 0), tout = outflow.reduce((s, x) => s + x[1], 0);
  const mx = Math.max(...inflow.map(x => x[1]), ...outflow.map(x => x[1]));
  const mc = monthlyCash(null).slice(0, months);
  const low = mc.reduce((a, b) => (b.cash < a.cash ? b : a));
  const ft = familyTotals();
  return (
    <>
      <PageHead title="Cash flow" sub="Where money comes from and where it goes in a typical month, and how cash is likely to move over the coming months." />
      <div className="grid g4">
        <Kpi label="Money in, a typical month" value={<span className="t-gain">+{inr(tin * CR)}</span>} />
        <Kpi label="Money out, a typical month" value={<span className="t-loss">−{inr(tout * CR)}</span>} />
        <Kpi label="Net each month" value={inr((tin - tout) * CR)} foot={<span>before seasonal swings</span>} />
        <Kpi label={`Lowest point next ${months} months`} value={inr(low.cash * CR)} foot={<><span className={`delta ${low.cash / ft.fixedMonthly < 2 ? 'warn' : 'flat'}`}>{(low.cash / ft.fixedMonthly).toFixed(1)} months</span><span>in {low.label}</span></>} />
      </div>
      <Card title={`Cash over the next ${months} months`} hint="All businesses and family accounts together. Months below one month of running costs are marked amber."
        actions={<Seg label="Months ahead" value={months} onChange={setMonths} options={[[6, '6 months'], [12, '12 months'], [24, '24 months']]} />}>
        <CashChart mc={mc} />
      </Card>
      <div className="grid g2">
        <Card title="Coming in"><HBar max={mx} rows={inflow.map(([n, v, id]) => ({ n, v, dot: id, color: `var(--c-${id})`, label: inr(v * CR) }))} /></Card>
        <Card title="Going out"><HBar max={mx} rows={outflow.map(([n, v]) => ({ n, v, color: 'var(--brand)', label: inr(v * CR) }))} /></Card>
      </div>
    </>
  );
}

/* ---------------- Investments ---------------- */
const PORTFOLIO_HISTORY = [21.1, 21.6, 21.3, 22.0, 22.4, 22.1, 23.0, 23.4, 23.9, 24.2, 24.6]; // sample month-end values, ₹ Cr
export function Investments() {
  const [type, setType] = useState('all');
  const iv = FAMILY.investments;
  const inv = iv.reduce((s, x) => s + x.inv, 0), val = iv.reduce((s, x) => s + x.val, 0);
  const byType = {}; iv.forEach(x => { byType[x.type] = (byType[x.type] || 0) + x.val; });
  const types = Object.keys(byType);
  const shown = type === 'all' ? iv : iv.filter(x => x.type === type);
  const mixColors = ['hyg', 'oil', 'jute', 'jj', 'fam'];
  return (
    <>
      <PageHead title="Investments" sub="Stocks, mutual funds, fixed deposits and bonds held by the family outside the businesses." />
      <div className="grid g4">
        <Kpi label="Current value" value={inr(val * CR)} />
        <Kpi label="Amount invested" value={inr(inv * CR)} />
        <Kpi label="Gain so far" value={<span className="t-gain">+{inr((val - inv) * CR)}</span>} foot={<Delta x={val / inv - 1} kind="pct" />} />
        <Kpi label="Return, last 12 months" value={pct(iv.reduce((s, x) => s + x.val * x.ret1y, 0) / val)} foot={<span>weighted by value</span>} />
      </div>
      <div className="grid g-main">
        <Card title="Portfolio value, last 12 months" hint="₹ crore, all holdings">
          <ChartCanvas label="Portfolio value" build={() => {
            const acc = cssv('--accent'); const o = baseOpts(); o.scales.y.beginAtZero = false;
            return { type: 'line', data: { labels: MONTHS12, datasets: [{ label: 'Value', data: [...PORTFOLIO_HISTORY, val], borderColor: acc, backgroundColor: alpha(acc, 0.12), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }] }, options: o };
          }} />
        </Card>
        <Card title="Mix">
          <ChartCanvas size="sm" label="Investment mix" build={() => ({ type: 'doughnut', data: { labels: types, datasets: [{ data: Object.values(byType), backgroundColor: mixColors.map(coC), borderColor: cssv('--card'), borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${inr(c.raw * CR)}` } } } } })} />
          <div className="legend mt" style={{ marginTop: 12 }}>{types.map((k, i) => <span key={k}><i style={{ background: `var(--c-${mixColors[i]})`, height: 8, width: 8, borderRadius: 2 }} />{k} {pct(byType[k] / val, 0)}</span>)}</div>
        </Card>
      </div>
      <Card title="Holdings" bodyClass="card-b tbl-wrap" actions={<Seg label="Filter by type" value={type} onChange={setType} options={[['all', 'All'], ...types.map(t => [t, t])]} />}>
        <table className="tbl">
          <thead><tr><th>Holding</th><th>Type</th><th className="r">Invested</th><th className="r">Current value</th><th className="r">Gain</th><th className="r">Return, 12 months</th></tr></thead>
          <tbody>{shown.map(x => (
            <tr key={x.n}><td>{x.n}</td><td className="t-muted">{x.type}</td><td className="r">{inr(x.inv * CR)}</td>
              <td className="r"><Trace label={x.n} value={x.val * CR} rows={[famRow(x.n, x.val, x.row)]}>{inr(x.val * CR)}</Trace></td>
              <td className="r t-gain">+{inr((x.val - x.inv) * CR)}</td><td className="r">{pct(x.ret1y)}</td></tr>
          ))}</tbody>
        </table>
      </Card>
    </>
  );
}
