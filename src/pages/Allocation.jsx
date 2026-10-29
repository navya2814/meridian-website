import { useDeferredValue, useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { Icon } from '../components/Icon.jsx';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { SuggestCard } from '../components/finance.jsx';
import { CashChart } from './Resources.jsx';
import { Callout, Card, CoDot, Delta, Empty, Kv, PageHead, Seg, SliderRow, Spark, Tabs, Tag, useTab } from '../components/ui.jsx';
import { CO, COMPANIES, MARKET, SELLABLE, FUND_META, FD_RATE } from '../lib/data.js';
import { CR, inr, pct, cssv, coC, alpha, clone, fmtDate, DATA_AS_OF } from '../lib/format.js';
import { baseOpts, hBarOpts } from '../lib/charts.js';
import {
  analyse, blankScenario, bulkItems, describe, metrics, monteCarlo, monthlyCash, ranking, scenarioReport, scSummary, simulate, suggestions,
} from '../lib/engine.js';
import { ReportView } from './Reports.jsx';

/* ---------------- Advice ---------------- */
function Advice() {
  const ms = COMPANIES.map(c => ({ c, m: metrics(c) }));
  const K = COMPANIES.reduce((s, c) => s + c.capital, 0);
  const TP = ms.reduce((s, x) => s + Math.max(0, x.m.trueProfit), 0);
  return (
    <>
      <Card title="Where the money is compared with where the profit comes from" hint="Share of capital invested against share of true net profit. A business whose profit bar is shorter than its capital bar is using money less efficiently than the others.">
        <ChartCanvas size="sm" label="Share of capital and profit" build={() => ({ type: 'bar', data: { labels: ms.map(x => x.c.short), datasets: [
          { label: 'Share of capital', data: ms.map(x => x.c.capital / K * 100), backgroundColor: ms.map(x => alpha(coC(x.c.id), 0.3)), borderColor: ms.map(x => coC(x.c.id)), borderWidth: 1, borderRadius: 4, maxBarThickness: 16 },
          { label: 'Share of true net profit', data: ms.map(x => Math.max(0, x.m.trueProfit) / TP * 100), backgroundColor: ms.map(x => coC(x.c.id)), borderRadius: 4, maxBarThickness: 16 },
        ] }, options: hBarOpts({ legend: true, xTick: v => v + '%', tip: c => ` ${c.dataset.label}: ${c.raw.toFixed(1)}%` }) })} />
      </Card>
      {suggestions().map(s => <section className="card" key={s.id}><div className="card-b" style={{ paddingTop: 20 }}><SuggestCard s={s} /></div></section>)}
      <Callout>These are suggestions to support the family's decision, not instructions. They use true net profit after provisions, so a business with large unfunded obligations is not ranked higher than it deserves. Check the data each one relied on before acting.</Callout>
    </>
  );
}

/* ---------------- Ranking ---------------- */
function Rank() {
  const rk = ranking();
  const why = (a, b) => {
    const r = [];
    if (a.roce > b.roce) r.push(`earns ${pct(a.roce)} on capital after provisions against ${pct(b.roce)}`);
    if (a.cashDays < b.cashDays) r.push(`gets cash back in ${a.cashDays} days instead of ${b.cashDays}`);
    if (a.de < b.de) r.push(`carries less debt (${a.de.toFixed(2)} against ${b.de.toFixed(2)} of net assets)`);
    if (a.margin > b.margin) r.push(`keeps more of each sale (${pct(a.margin)} against ${pct(b.margin)})`);
    return r.slice(0, 3).join(', ');
  };
  return (
    <>
      <Card title="Businesses ranked on the same measures" hint="Weights: return on capital 35%, how fast cash comes back 20%, true margin 20%, debt level 15%, dependence on one input or buyer 10%." bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Rank</th><th>Business</th><th className="r">Return on capital</th><th className="r">Days for cash to come back</th><th className="r">True margin</th><th className="r">Debt to net assets</th><th className="r">Biggest dependence</th><th>Score</th></tr></thead>
          <tbody>{rk.map((r, i) => (
            <tr key={r.c.id}>
              <td><span className={`rank-n ${i === 0 ? 'first' : ''}`}>{i + 1}</span></td>
              <td><div className="co-cell"><CoDot id={r.c.id} />{r.c.short}</div></td>
              <td className={`r ${r.roce < 0.05 ? 't-loss' : ''}`}>{pct(r.roce)}</td>
              <td className={`r ${r.cashDays > 120 ? 't-warn' : ''}`}>{r.cashDays}</td>
              <td className="r">{pct(r.margin)}</td>
              <td className="r">{r.de.toFixed(2)}</td>
              <td className="r">{pct(r.dep, 0)} <span className="t-muted small">{r.c.rawDep >= r.c.topCust ? r.c.rawName.split(' ')[0].toLowerCase() : 'one buyer'}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}><span className="num">{r.score.toFixed(0)}</span><span className="score-bar"><i style={{ width: `${r.score}%` }} /></span></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
      <Card title="Why each business ranks where it does">
        <div className="list">
          {rk.slice(0, rk.length - 1).slice(0, 3).map((r, i) => (
            <div className="list-row" key={r.c.id}><span className={`sev ${i === 0 ? 'gain' : 'info'}`} /><div><div className="t">{r.c.short} ranks above {rk[i + 1].c.short}</div><div className="d">It {why(r, rk[i + 1]) || 'scores higher once all five measures are weighed together'}.</div></div></div>
          ))}
          {rk.filter(r => r.m.unfunded.length).map(r => (
            <div className="list-row" key={'u' + r.c.id}><span className="sev warn" /><div><div className="t">{r.c.short}: unfunded obligations count against it</div><div className="d">Book profit of {inr(r.m.ttmProfit * CR)} becomes {inr(r.m.trueProfit * CR)} after {r.m.unfunded.map(([k]) => FUND_META[k].n.toLowerCase()).join(', ')} are provided for. The ranking uses the lower figure.</div></div></div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ---------------- Bulk buying ---------------- */
function Bulk() {
  return (
    <>
      <div className="grid g2">{bulkItems().map(x => { const m = MARKET[x.k]; return (
        <section className="card" key={x.k}>
          <div className="card-h"><div><h3 className="row" style={{ gap: 8 }}><CoDot id={x.co} />{m.n}</h3><p className="hint">{CO[x.co].short} · {m.s[11].toLocaleString('en-IN')} {m.unit}</p></div><Tag tone={x.tone}>{x.verdict}</Tag></div>
          <div className="card-b" style={{ display: 'grid', gap: 12 }}>
            <div style={{ height: 44 }}><Spark vals={m.s} color={coC(x.co)} w={300} h={44} /></div>
            <Kv items={[['Suggested quantity', <span key="q" style={{ fontFamily: 'var(--f-ui)' }}>{x.qty}</span>], ...(x.cash ? [['Cash needed', inr(x.cash * CR)]] : [])]} />
            <p><b>Price trend.</b> {x.trend}</p><p><b>Cost of buying early.</b> {x.cost}</p><p className="note">{x.math}</p>
          </div>
        </section>); })}
      </div>
      <Callout>Price figures are sample data. Connect a live price feed and these suggestions will update with real market moves.</Callout>
    </>
  );
}

/* ---------------- What If simulator ---------------- */
function getPath(o, path) { return path.split('.').reduce((x, k) => (x == null ? x : x[k]), o); }
function setPath(o, path, v) { const ks = path.split('.'); let x = o; for (let i = 0; i < ks.length - 1; i++) x = x[ks[i]]; x[ks[ks.length - 1]] = v; }

function Group({ k, icon, title, children, open }) {
  const { sc, setSc } = useApp();
  const on = sc[k].on;
  return (
    <details className="ctrl" open={open || on}>
      <summary><Icon name={icon} />{title}{on && <span className="on-badge">On</span>}<Icon name="chevD" className="chev" /></summary>
      <div className="ctrl-b">
        <label className="row small" style={{ gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={on} onChange={e => setSc(p => { const n = clone(p); n[k].on = e.target.checked; return n; })} /> Include in this scenario</label>
        {children}
      </div>
    </details>
  );
}

function CoSelect({ path, fam }) {
  const { sc, setSc } = useApp();
  const v = getPath(sc, path);
  return (
    <select className="input" value={v} onChange={e => setSc(p => { const n = clone(p); setPath(n, path, e.target.value); n[path.split('.')[0]].on = true; return n; })}>
      {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}{fam && <option value="fam">Family cash</option>}
    </select>
  );
}

function Controls({ focus }) {
  const { sc, setSc } = useApp();
  const upd = path => v => setSc(p => { const n = clone(p); setPath(n, path, v); const g = path.split('.')[0]; if (g !== 'cases') n[g].on = true; return n; });
  const sl = (path, min, max, step, scale = 1, unit, label) => <SliderRow value={getPath(sc, path)} onChange={upd(path)} min={min} max={max} step={step} scale={scale} unit={unit} label={label || path} />;
  const asset = SELLABLE.find(a => a.id === sc.sell.asset);
  const caseInput = (c, f, l) => <div className="field"><label>{l}</label><input className="input num" type="number" step="1" value={+(sc.cases[c][f] * 100).toFixed(2)} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) upd(`cases.${c}.${f}`)(v / 100); }} /></div>;
  return (
    <div className="sim-controls">
      <div className="row" style={{ justifyContent: 'space-between' }}><span className="sec-title">Change something</span><button className="btn ghost sm" onClick={() => setSc(blankScenario())}>Clear all</button></div>
      <Group k="move" icon="move" title="Move money between businesses">
        <div className="row"><div className="field"><label>From</label><CoSelect path="move.from" /></div><div className="field"><label>To</label><CoSelect path="move.to" /></div></div>
        <Seg value={sc.move.mode} onChange={upd('move.mode')} options={[['pct', 'By percentage'], ['amt', 'By amount']]} />
        {sc.move.mode === 'pct' ? sl('move.pct', 0, 50, 1, 0.01, "Percent of the source business's capital", 'Percent to move') : sl('move.amt', 0, 1500, 10, 1, '₹ lakh', 'Amount to move')}
      </Group>
      <Group k="invest" icon="plus" title="Invest in a business">
        <div className="field"><label>Business</label><CoSelect path="invest.co" /></div>{sl('invest.amt', 0, 1000, 5, 1, '₹ lakh, from family cash and fixed deposits', 'Amount to invest')}
      </Group>
      <Group k="withdraw" icon="minus" title="Withdraw from a business">
        <div className="field"><label>Business</label><CoSelect path="withdraw.co" /></div>{sl('withdraw.amt', 0, 1000, 5, 1, '₹ lakh, into family cash', 'Amount to withdraw')}
      </Group>
      <Group k="sell" icon="tag" title="Sell an asset">
        <div className="field"><label>Asset</label>
          <select className="input" value={sc.sell.asset} onChange={e => setSc(p => { const n = clone(p); n.sell.asset = e.target.value; n.sell.on = true; n.sell.price = Math.round(SELLABLE.find(a => a.id === e.target.value).book * 100); return n; })}>
            {SELLABLE.map(a => <option key={a.id} value={a.id}>{a.n} (book {inr(a.book * CR)})</option>)}
          </select></div>
        {sl('sell.price', 0, Math.round(asset.book * 200), 5, 1, '₹ lakh, the price you expect', 'Sale price')}
      </Group>
      <Group k="loan" icon="bank" title="Take a loan">
        <div className="field"><label>Use the money for</label><CoSelect path="loan.co" fam /></div>
        <div className="field"><span className="lab">Amount (₹ lakh)</span>{sl('loan.amt', 0, 2000, 10, 1, '', 'Loan amount')}</div>
        <div className="field"><span className="lab">Interest rate (% a year)</span>{sl('loan.rate', 6, 16, 0.25, 0.01, '', 'Interest rate')}</div>
        <div className="field"><span className="lab">Years to repay</span>{sl('loan.years', 1, 15, 1, 1, '', 'Years')}</div>
      </Group>
      <Group k="repay" icon="repay" title="Repay debt">
        <div className="field"><label>Business</label><CoSelect path="repay.co" /></div>{sl('repay.amt', 0, 1500, 10, 1, '₹ lakh', 'Amount to repay')}
        <Seg value={sc.repay.mode} onChange={upd('repay.mode')} options={[['lump', 'One payment'], ['inst', 'Instalments']]} />
        {sc.repay.mode === 'inst' && <div className="field"><span className="lab">Over how many months</span>{sl('repay.months', 2, 36, 1, 1, '', 'Months')}</div>}
      </Group>
      <Group k="monthly" icon="calendar" title="Change monthly investment">
        {COMPANIES.map(c => <div className="field" key={c.id}><span className="lab row" style={{ gap: 7 }}><CoDot id={c.id} />{c.short}</span><SliderRow value={sc.monthly[c.id] || 0} onChange={upd('monthly.' + c.id)} min={-20} max={20} step={0.5} label={`${c.short} monthly`} /></div>)}
        <p className="note">₹ lakh a month. Minus means taking money out each month.</p>
      </Group>
      <Group k="growth" icon="trend" title="Change growth rate" open={focus}>
        {COMPANIES.map(c => <div className="field" key={c.id}><span className="lab row" style={{ gap: 7, justifyContent: 'space-between' }}><span className="row" style={{ gap: 7 }}><CoDot id={c.id} />{c.short}</span><span className="t-muted">history {pct(c.g, 0)}</span></span>
          <SliderRow value={sc.growth[c.id] == null ? c.g : sc.growth[c.id]} onChange={upd('growth.' + c.id)} min={-10} max={30} step={1} scale={0.01} label={`${c.short} growth`} /></div>)}
        <p className="note">Yearly sales growth, %.</p>
      </Group>
      <Group k="outside" icon="globe" title="Change outside conditions">
        {[['gold', 'Gold price'], ['palm', 'Edible oil price'], ['jute', 'Raw jute price'], ['pulp', 'Pulp price'], ['sales', 'Sales, all businesses']].map(([k, l]) => <div className="field" key={k}><span className="lab">{l} (% change)</span>{sl('outside.' + k, -30, 30, 1, 0.01, '', l)}</div>)}
      </Group>
      <details className="ctrl"><summary><Icon name="settings" />Best and worst case assumptions<Icon name="chevD" className="chev" /></summary>
        <div className="ctrl-b">
          <div className="sec-title">Best case</div><div className="row">{caseInput('best', 'g', 'Growth (pts)')}{caseInput('best', 'price', 'Input prices (%)')}{caseInput('best', 'sales', 'Sales (%)')}</div>
          <div className="sec-title">Worst case</div><div className="row">{caseInput('worst', 'g', 'Growth (pts)')}{caseInput('worst', 'price', 'Input prices (%)')}{caseInput('worst', 'sales', 'Sales (%)')}</div>
        </div>
      </details>
    </div>
  );
}

function Results({ sc }) {
  const { version } = useApp();
  const key = JSON.stringify(sc) + version;
  const R = useMemo(() => {
    const A = analyse(sc), d = describe(sc);
    return { A, d,
      best: simulate(sc, { ...sc.cases.best }), worst: simulate(sc, { ...sc.cases.worst }),
      bb: simulate(blankScenario(), { ...sc.cases.best }), bw: simulate(blankScenario(), { ...sc.cases.worst }),
      mc: d.length ? monteCarlo(sc, 200) : null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const { A, d, best, worst, bb, bw, mc } = R;
  const { s, b, ft } = A;
  const nw5 = s.yearly[4].nw - b.yearly[4].nw;
  const hp = A.tpD >= 0 ? <>increases true profit by <span className="g">↑ {inr(A.tpD * CR)}</span> a year</> : <>reduces true profit by <span className="l">↓ {inr(-A.tpD * CR)}</span> a year</>;
  const cashPart = A.monthsLow < 2 ? <>but cash reserves fall to <span className="l">{A.monthsLow < 1 ? 'under one month' : 'under two months'}</span> at the lowest point</>
    : A.monthsLow < A.monthsLowB - 0.25 ? <>and cash still covers {A.monthsLow.toFixed(1)} months of costs at the lowest point, down from {A.monthsLowB.toFixed(1)}</>
    : <>and keeps cash above {Math.floor(A.monthsLow)} months of running costs</>;
  const Kb = b.st.reduce((a, x) => a + x.K, 0), Ks = s.st.reduce((a, x) => a + x.K, 0);
  const yfB = A.mcb.slice(0, 12).reduce((a, x) => a + x.op, 0), yfS = A.mc.slice(0, 12).reduce((a, x) => a + x.op, 0);
  const debtNow = ft.liab - COMPANIES.reduce((a, c) => a + c.bs.payables + c.bs.advances + c.bs.otherL, 0);
  const money = v => inr(v * CR), pc = v => pct(v), mo = v => v.toFixed(1) + ' mo', ratio = v => pct(v, 0);
  const row = (l, now, wo, w, fmt = money, inv = false) => { const diff = w - wo; return (
    <tr key={l}><td>{l}</td><td className="r">{now == null ? <span className="t-muted">–</span> : fmt(now)}</td><td className="r">{fmt(wo)}</td><td className="r"><b>{fmt(w)}</b></td>
      <td className="r">{Math.abs(diff) < 1e-6 ? <span className="t-muted">No change</span> : <span className={(inv ? diff < 0 : diff > 0) ? 't-gain' : 't-loss'}>{diff > 0 ? '↑ +' : '↓ −'}{fmt(Math.abs(diff)).replace('−', '')}</span>}</td></tr>); };

  return (
    <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
      <section className="card"><div className="card-b" style={{ display: 'grid', gap: 12, paddingTop: 20 }}>
        <div className="headline">{d.length ? <>This plan {hp} {cashPart}.</> : 'Turn on a change on the left to see what would happen.'}</div>
        {d.length > 0 && <div className="chips">{d.map(x => <span className="chip" key={x}>{x}</span>)}</div>}
        {A.warns.map(([t, w]) => <Callout key={w} tone={t}><b>{t === 'loss' ? 'Warning.' : 'Watch.'}</b> {w}</Callout>)}
        <div className="stats">
          <div className="stat"><span className="l">Net worth in 5 years</span><span className="v">{inr(s.yearly[4].nw * CR)}</span><Delta x={nw5 * CR} /></div>
          <div className="stat"><span className="l">True profit a year</span><span className="v">{inr(s.yearly[1].trueProfit * CR)}</span><Delta x={A.tpD * CR} /></div>
          <div className="stat"><span className="l">Lowest cash, next 12 months</span><span className="v">{inr(A.low.cash * CR)}</span><Delta x={A.monthsLow - A.monthsLowB} kind="mo" /></div>
          <div className="stat"><span className="l">Debt after 1 year</span><span className="v">{inr(s.yearly[0].debt * CR)}</span><Delta x={(s.yearly[0].debt - b.yearly[0].debt) * CR} invert /></div>
        </div>
      </div></section>
      <div className="grid g2">
        <Card title="Projected net worth" hint="10 years, current path and this scenario">
          <ChartCanvas label="Projected net worth" deps={[key]} build={() => {
            const sv = [ft.nw, ...s.yearly.map(y => y.nw)], bv = [ft.nw, ...b.yearly.map(y => y.nw)];
            const better = sv[sv.length - 1] >= bv[bv.length - 1], col = cssv(better ? '--gain' : '--loss');
            return { type: 'line', data: { labels: ['Today', ...s.yearly.map(y => `Y${y.y}`)], datasets: [
              { label: 'This scenario', data: sv, borderColor: col, backgroundColor: alpha(col, 0.1), fill: '+1', tension: 0.3, pointRadius: 0, borderWidth: 2.4 },
              { label: 'Current path', data: bv, borderColor: cssv('--muted'), borderDash: [5, 4], tension: 0.3, pointRadius: 0, borderWidth: 1.5 }] }, options: baseOpts({ legend: true }) };
          }} />
        </Card>
        <Card title="True profit by business, year 2" hint="Before (light) and after (solid) the change">
          <ChartCanvas label="True profit by business" deps={[key]} build={() => ({ type: 'bar', data: { labels: s.st.map(x => x.c.short.split(' ')[0]), datasets: [
            { label: 'Before', data: b.coYear.map(c => c[1].trueP), backgroundColor: s.st.map(x => alpha(coC(x.id), 0.3)), borderRadius: 4, maxBarThickness: 28 },
            { label: 'After', data: s.coYear.map(c => c[1].trueP), backgroundColor: s.st.map(x => coC(x.id)), borderRadius: 4, maxBarThickness: 28 }] }, options: baseOpts({ legend: true }) })} />
        </Card>
      </div>
      <Card title="Cash by month" hint="Next 24 months. Amber bars are below one month of running costs; red bars are negative.">
        <CashChart mc={A.mc} mcb={A.mcb} />
      </Card>
      <div className="grid g-main">
        <Card title="Where the gain or loss comes from" hint="Yearly income in year 2: true profit of each business, loan interest and interest on family cash">
          <ChartCanvas label="Waterfall of changes in true profit" deps={[key]} build={() => {
            const gain = cssv('--gain'), loss = cssv('--loss'), mut = cssv('--muted'), acc = cssv('--accent');
            const steps = []; let run = b.yearly[1].trueProfit;
            const loanCo = sc.loan.on ? sc.loan.co : null, li = s.yearly[1].loanInt || 0;
            s.st.forEach((x, i) => { let dd = s.coYear[i][1].trueP - b.coYear[i][1].trueP; if (loanCo === x.id) dd += li; if (Math.abs(dd) > 0.002) steps.push([x.c.short, dd]); });
            if (li) steps.push(['Interest on new loan', -li]);
            const cashD = (s.famLiquid0 - b.famLiquid0) * FD_RATE; if (Math.abs(cashD) > 0.002) steps.push([cashD > 0 ? 'Interest on cash released' : 'Deposit interest given up', cashD]);
            const data = [[0, run]], lab = ['Without change'], cols = [alpha(mut, 0.45)];
            steps.forEach(([n, dd]) => { data.push([run, run + dd]); run += dd; lab.push(n); cols.push(dd >= 0 ? gain : loss); });
            data.push([0, run]); lab.push('With change'); cols.push(acc);
            const o3 = baseOpts({ tip: c => { const [a, z] = c.raw; const i = c.dataIndex; return i === 0 || i === data.length - 1 ? ` ${inr(z * CR)}` : ` ${z - a >= 0 ? '+' : '−'}${inr(Math.abs(z - a) * CR)}`; } });
            o3.scales.x.ticks.autoSkip = false; o3.scales.x.ticks.font = { family: 'Geist', size: 10.5 };
            o3.scales.x.ticks.callback = function (v) { const l = this.getLabelForValue(v); return l.length > 14 ? l.split(' ').reduce((a, w) => { const last = a[a.length - 1]; if ((last + ' ' + w).trim().length > 14) a.push(w); else a[a.length - 1] = (last + ' ' + w).trim(); return a; }, ['']) : l; };
            return { type: 'bar', data: { labels: lab, datasets: [{ label: 'True profit', data, backgroundColor: cols, borderRadius: 4, maxBarThickness: 46 }] }, options: o3 };
          }} />
        </Card>
        <Card title="Best, expected and worst case" hint="Net worth in 5 years, and the gain or loss against doing nothing in the same conditions" bodyStyle={{ display: 'grid', gap: 12 }}>
          <div className="cases" style={{ gridTemplateColumns: '1fr' }}>
            {[['Best case', best, bb], ['Expected', s, b], ['Worst case', worst, bw]].map(([n, x, y], i) => (
              <div className={`case ${i === 1 ? 'mid' : ''}`} key={n}><span className="h">{n}</span><span className="v">{inr(x.yearly[4].nw * CR)}</span><span><Delta x={(x.yearly[4].nw - y.yearly[4].nw) * CR} /> <span className="small t-muted">vs. no change</span></span></div>
            ))}
          </div>
          {mc && <Kv items={[
            ['Chance this plan leaves you worse off in 5 years', pct(mc.lossChance, 0), mc.lossChance > 0.3 ? 't-loss' : mc.lossChance > 0.1 ? 't-warn' : 't-gain'],
            ['Bad outcome (1 in 10)', mc.p10 < 0 ? <span key="p" className="t-loss">↓ −{inr(-mc.p10 * CR)}</span> : <span key="p" className="t-gain">↑ +{inr(mc.p10 * CR)}</span>],
            ['When it pays for itself', <span key="pb" style={{ fontFamily: 'var(--f-ui)' }}>{A.payback}</span>],
          ]} />}
          <p className="note">Based on 200 random runs of growth, prices and sales around your expected case.</p>
        </Card>
      </div>
      <Card title="Current and projected position, whole family" hint="Today, then one year ahead with and without the change" bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Measure</th><th className="r">Today</th><th className="r">Year 1, no change</th><th className="r">Year 1, with change</th><th className="r">Difference</th></tr></thead>
          <tbody>
            {row('Net worth', ft.nw, b.yearly[0].nw, s.yearly[0].nw)}
            {row('Cash flow a month', null, yfB / 12, yfS / 12)}
            {row('Cash flow a year', null, yfB, yfS)}
            {row('Return on capital (true profit)', ft.trueProfit / COMPANIES.reduce((a, c) => a + c.capital, 0), b.yearly[0].trueProfit / Kb, s.yearly[0].trueProfit / Ks, pc)}
            {row('Cash available', ft.cash, A.mcb[11].cash, A.mc[11].cash)}
            {row('Months of costs covered', ft.cash / ft.fixedMonthly, A.mcb[11].cash / ft.fixedMonthly, A.mc[11].cash / A.obligations, mo)}
            {row('Total debt', debtNow, b.yearly[0].debt, s.yearly[0].debt, money, true)}
            {row('Interest paid a year', COMPANIES.reduce((a, c) => a + c.bs.debt * c.rate, 0) + 0.27, b.yearly[0].interest + 0.27, s.yearly[0].interest + 0.27, money, true)}
            {row('Debt compared to assets', debtNow / ft.assets, b.yearly[0].debt / b.yearly[0].assets, s.yearly[0].debt / s.yearly[0].assets, ratio, true)}
          </tbody>
        </table>
      </Card>
      <Card title="Value over time" hint="Each business's net assets and the family's total wealth" bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th />{[1, 3, 5, 10].map(y => <th className="r" key={y}>Year {y}</th>)}<th className="r">ROI, year 2</th></tr></thead>
          <tbody>{s.st.map((x, i) => (
            <tr key={x.id}><td><div className="co-cell"><CoDot id={x.id} />{x.c.short}</div></td>
              {[0, 2, 4, 9].map(y => <td className="r" key={y}>{inr(s.coYear[i][y].E * CR)} <Delta x={(s.coYear[i][y].E - b.coYear[i][y].E) * CR} style={{ fontSize: 10.5 }} /></td>)}
              <td className="r">{pct(s.coYear[i][1].trueP / s.coYear[i][1].K)}</td></tr>
          ))}</tbody>
          <tfoot><tr><td>Family total wealth</td>{[0, 2, 4, 9].map(y => <td className="r" key={y}>{inr(s.yearly[y].nw * CR)}</td>)}<td className="r">{pct(s.yearly[1].trueProfit / Ks)}</td></tr></tfoot>
        </table>
      </Card>
      {d.length > 0 && <Card title="Why the numbers changed" hint="Results use true net profit, after reserves and provisions."><ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>{s.notes.map(n => <li key={n}>{n}</li>)}</ul></Card>}
    </div>
  );
}

function SavePanel() {
  const { sc, setSc, saved, setSaved, chosen, setChosen, toast, openModal } = useApp();
  const [name, setName] = useState('');
  const [cmp, setCmp] = useState([]);
  const save = () => {
    const d = describe(sc);
    if (!d.length) return toast('Turn on at least one change before saving');
    const n = name.trim() || `Scenario ${saved.length + 1}`;
    setSaved([...saved.filter(x => x.name !== n), { name: n, sc: clone(sc), date: fmtDate(DATA_AS_OF), changes: d, sum: scSummary(sc) }]);
    setName(''); toast(`Saved "${n}"`);
  };
  const exportSc = (n, s) => openModal('Scenario report', <ReportView text={scenarioReport(n, s)} />);
  const toggleCmp = n => { if (cmp.includes(n)) setCmp(cmp.filter(x => x !== n)); else if (cmp.length >= 3) toast('Compare up to three at a time'); else setCmp([...cmp, n]); };
  const remove = n => { setSaved(saved.filter(x => x.name !== n)); setCmp(cmp.filter(x => x !== n)); if (chosen === n) setChosen(null); };
  const cmpList = cmp.map(n => saved.find(x => x.name === n)).filter(Boolean);
  const chosenSc = saved.find(x => x.name === chosen);
  return (
    <>
      <section className="card"><div className="card-b row" style={{ justifyContent: 'space-between', paddingTop: 18 }}>
        <div className="row" style={{ flex: 1, minWidth: 220 }}><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Name this scenario, for example Jewellery to hygiene 10%" style={{ flex: 1, minWidth: 0 }} aria-label="Scenario name" /><button className="btn" onClick={save}><Icon name="save" /> Save</button></div>
        <button className="btn ghost" onClick={() => exportSc(name.trim() || 'Unsaved scenario', sc)}><Icon name="reports" /> Export as report</button>
      </div></section>
      <Card title="Saved scenarios" hint="Tick up to three to compare side by side. Mark one as the chosen plan to track it against real results." bodyStyle={{ display: 'grid', gap: 16 }}>
        {saved.length ? (
          <div className="list">{saved.map((x, i) => (
            <div className="list-row" style={{ alignItems: 'center', flexWrap: 'wrap' }} key={x.name}>
              <input type="checkbox" id={`cmp${i}`} checked={cmp.includes(x.name)} onChange={() => toggleCmp(x.name)} aria-label={`Compare ${x.name}`} />
              <label htmlFor={`cmp${i}`} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}><div className="t">{x.name} {chosen === x.name && <Tag tone="growing" style={{ marginLeft: 6 }}>Chosen plan</Tag>}</div><div className="d">{x.changes.join(' · ')}</div></label>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn ghost sm" onClick={() => { setSc(clone(x.sc)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Open</button>
                <button className="btn ghost sm" onClick={() => { const n = chosen === x.name ? null : x.name; setChosen(n); if (n) toast(`"${n}" marked as the chosen plan`); }}><Icon name="star" /> {chosen === x.name ? 'Chosen' : 'Choose'}</button>
                <button className="btn ghost sm" onClick={() => exportSc(x.name, x.sc)}>Export</button>
                <button className="icon-btn" style={{ color: 'var(--muted)' }} onClick={() => remove(x.name)} aria-label={`Delete ${x.name}`}><Icon name="close" /></button>
              </div>
            </div>))}
          </div>
        ) : <Empty>Nothing saved yet. Name a scenario above and select Save.</Empty>}
        {cmpList.length >= 2 && (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Compare</th>{cmpList.map(x => <th className="r" key={x.name}>{x.name}</th>)}</tr></thead>
            <tbody>{[
              ['Net worth in 5 years', s => inr(s.nw5 * CR)],
              ['Change in true profit a year', s => <span className={s.tpD >= 0 ? 't-gain' : 't-loss'}>{s.tpD >= 0 ? '↑ +' : '↓ −'}{inr(Math.abs(s.tpD) * CR)}</span>],
              ['Lowest cash cover', s => s.months.toFixed(1) + ' months'],
              ['Debt after 1 year', s => inr(s.debt * CR)],
              ['Warnings', s => (s.warns ? <span className="t-warn">{s.warns}</span> : <span className="t-gain">None</span>)],
              ['Pays for itself', s => <span style={{ fontFamily: 'var(--f-ui)' }}>{s.payback}</span>],
            ].map(([l, f]) => <tr key={l}><td>{l}</td>{cmpList.map(x => <td className="r" key={x.name}>{f(x.sum)}</td>)}</tr>)}</tbody>
          </table></div>
        )}
        {cmpList.length === 1 && <p className="note">Tick one more scenario to compare.</p>}
        {chosenSc && (
          <>
            <div className="divider" />
            <div>
              <h3 style={{ fontSize: 14 }}>Tracking the chosen plan: {chosenSc.name}</h3>
              <p className="note" style={{ margin: '4px 0 10px' }}>Predicted figures are fixed today. Actual figures fill in as each month's books are imported.</p>
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Month</th><th className="r">Predicted cash</th><th className="r">Actual cash</th><th className="r">Predicted true profit</th><th className="r">Actual</th><th>Status</th></tr></thead>
                <tbody>{monthlyCash(chosenSc.sc).slice(0, 6).map((m, i) => (
                  <tr key={m.label}><td>{m.label}</td><td className="r">{inr(m.cash * CR)}</td><td className="r t-muted">Awaiting books</td><td className="r">{inr(chosenSc.sum.tp / 12 * CR)}</td><td className="r t-muted">Awaiting books</td><td className="small t-muted">{i === 0 ? 'Due after 30 Nov 2026 import' : 'Scheduled'}</td></tr>
                ))}</tbody>
              </table></div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function WhatIf() {
  const { sc } = useApp();
  const deferred = useDeferredValue(sc);
  const focus = sc.growth.on && !sc.move.on;
  return (
    <>
      <div className="sim">
        <Controls focus={focus} />
        <Results sc={deferred} />
      </div>
      <SavePanel />
    </>
  );
}

export default function Allocation() {
  const [tab, setTab] = useTab('advice', ['advice', 'rank', 'whatif', 'bulk']);
  return (
    <>
      <PageHead title="Resource allocation" sub="Where the family's money is working hardest, where it could work harder, and a simulator to test any change before making it." />
      <Tabs value={tab} onChange={setTab} list={[['advice', 'Advice'], ['rank', 'Compare and rank'], ['whatif', 'What if?'], ['bulk', 'When to buy raw materials']]} />
      {tab === 'advice' && <Advice />}
      {tab === 'rank' && <Rank />}
      {tab === 'whatif' && <WhatIf />}
      {tab === 'bulk' && <Bulk />}
    </>
  );
}
