import { useState } from 'react';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { Card, CoDot, Delta, PageHead, Seg } from '../components/ui.jsx';
import { COMPANIES, INV_RATE, PROP_RATE } from '../lib/data.js';
import { CR, inr, pct, cssv, alpha } from '../lib/format.js';
import { baseOpts } from '../lib/charts.js';
import { blankScenario, familyTotals, simulate } from '../lib/engine.js';

const METRICS = [['nw', 'Net worth'], ['rev', 'Sales'], ['profit', 'True profit'], ['debt', 'Debt']];
const TITLES = { nw: 'Projected net worth', rev: 'Projected sales, all businesses', profit: 'Projected true net profit', debt: 'Projected borrowings' };

export default function Forecast() {
  const [growth, setGrowth] = useState({});
  const [metric, setMetric] = useState('nw');
  const [horizon, setHorizon] = useState(5);
  const sc = blankScenario(); sc.growth.on = true; COMPANIES.forEach(c => { sc.growth[c.id] = growth[c.id] ?? null; });
  const s = simulate(sc), b = simulate(blankScenario()), ft = familyTotals();
  const pick = (r, y) => (metric === 'nw' ? r.yearly[y].nw : metric === 'rev' ? r.coYear.reduce((a, cy) => a + cy[y].rev, 0) : metric === 'profit' ? r.yearly[y].trueProfit : r.yearly[y].debt);
  const now = { nw: ft.nw, rev: ft.sales, profit: ft.trueProfit, debt: ft.liab - COMPANIES.reduce((a, c) => a + c.bs.payables + c.bs.advances + c.bs.otherL, 0) }[metric];
  const sv = [now, ...Array.from({ length: horizon }, (_, i) => pick(s, i))], bv = [now, ...Array.from({ length: horizon }, (_, i) => pick(b, i))];
  const changed = Object.keys(growth).length > 0;
  return (
    <>
      <PageHead title="Forecast" sub="Projects sales, profit, debt and net worth from the last two years of figures. Change the growth assumptions to see a different path." />
      <div className="grid g-side">
        <Card title="Assumptions" hint="Yearly sales growth for each business" bodyStyle={{ display: 'grid', gap: 16 }}
          actions={<button className="btn ghost sm" onClick={() => setGrowth({})} disabled={!changed}>Reset</button>}>
          {COMPANIES.map(c => { const v = growth[c.id] ?? c.g; return (
            <div className="field" key={c.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="lab row" style={{ gap: 7 }}><CoDot id={c.id} />{c.short}</span>
                <span className="num small">{pct(v, 0)} a year {growth[c.id] != null && <span className="t-muted">(history {pct(c.g, 0)})</span>}</span></div>
              <input type="range" min="-10" max="25" step="1" value={Math.round(v * 100)} aria-label={`${c.short} growth`} onChange={e => setGrowth({ ...growth, [c.id]: e.target.value / 100 })} />
            </div>); })}
          <div className="field"><span className="lab">Show</span><Seg label="Measure" value={metric} onChange={setMetric} options={METRICS} /></div>
          <div className="field"><span className="lab">Years ahead</span><Seg label="Years ahead" value={horizon} onChange={setHorizon} options={[[3, '3 years'], [5, '5 years'], [10, '10 years']]} /></div>
          <p className="note">History-based growth: {COMPANIES.map(c => `${c.short} ${pct(c.g, 0)}`).join(', ')}. Personal investments are assumed to grow {pct(INV_RATE, 0)} a year and property {pct(PROP_RATE, 0)}.</p>
        </Card>
        <Card title={TITLES[metric]} hint="Dashed line uses history-based growth">
          <ChartCanvas size="lg" label={TITLES[metric]} deps={[metric, horizon, JSON.stringify(growth)]} build={() => {
            const acc = cssv('--accent'), mut = cssv('--muted'); const o = baseOpts({ legend: true }); o.scales.y.beginAtZero = metric !== 'nw' && metric !== 'rev';
            return { type: 'line', data: { labels: ['Today', ...Array.from({ length: horizon }, (_, i) => `Year ${i + 1}`)], datasets: [
              { label: 'Your assumptions', data: sv, borderColor: acc, backgroundColor: alpha(acc, 0.1), fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2.2 },
              { label: 'History-based', data: bv, borderColor: mut, borderDash: [5, 4], pointRadius: 0, borderWidth: 1.5 }] }, options: o };
          }} />
        </Card>
      </div>
      <Card title="Year by year" bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Year</th>{COMPANIES.map(c => <th className="r" key={c.id}>{c.short} sales</th>)}<th className="r">True profit</th><th className="r">Debt</th><th className="r">Net worth</th></tr></thead>
          <tbody>{s.yearly.slice(0, horizon).map((y, i) => (
            <tr key={i}><td>Year {i + 1} <span className="t-muted small">(FY{28 + i})</span></td>{s.coYear.map((cy, j) => <td className="r" key={j}>{inr(cy[i].rev * CR)}</td>)}
              <td className="r">{inr(y.trueProfit * CR)}</td><td className="r">{inr(y.debt * CR)}</td><td className="r"><b>{inr(y.nw * CR)}</b> <Delta x={(y.nw - b.yearly[i].nw) * CR} /></td></tr>
          ))}</tbody>
        </table>
      </Card>
    </>
  );
}
