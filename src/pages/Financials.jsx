import { useState } from 'react';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { ReservesView } from '../components/finance.jsx';
import { Card, CoDot, Delta, Kpi, PageHead, Tabs, Trace, useTab } from '../components/ui.jsx';
import { COMPANIES, FAMILY, QTRS } from '../lib/data.js';
import { CR, inr, pct, coC } from '../lib/format.js';
import { baseOpts } from '../lib/charts.js';
import { bsRow, familyTotals, metrics, plRows } from '../lib/engine.js';

function ProfitTab() {
  const ms = COMPANIES.map(c => ({ c, m: metrics(c) }));
  const ft = familyTotals();
  const debt = COMPANIES.reduce((s, c) => s + c.bs.debt, 0);
  return (
    <>
      <div className="grid g4">
        <Kpi label="Sales, last 12 months" value={inr(ft.sales * CR)} foot={<><Delta x={ft.sales / ft.prevSales - 1} kind="pct" /><span>on the year before</span></>} />
        <Kpi label="Profit in the books" value={inr(ft.bookProfit * CR)} foot={<><Delta x={ft.bookProfit / ft.prevProfit - 1} kind="pct" /><span>on the year before</span></>} />
        <Kpi label="True net profit" value={inr(ft.trueProfit * CR)} foot={<span>{pct(ft.trueProfit / ft.bookProfit, 0)} of book profit is free to use</span>} />
        <Kpi label="Interest paid a year" value={inr(ms.reduce((s, x) => s + x.m.interest, 0) * CR)} foot={<span>on {inr(debt * CR)} of business debt</span>} />
      </div>
      <div className="grid g2">
        <Card title="Quarterly sales by business" hint="Last eight quarters, ₹ crore">
          <ChartCanvas label="Quarterly sales by business" build={() => ({ type: 'bar', data: { labels: QTRS, datasets: COMPANIES.map(c => ({ label: c.short, data: c.rev, backgroundColor: coC(c.id), borderRadius: 3, maxBarThickness: 34 })) }, options: baseOpts({ legend: true, stacked: true }) })} />
        </Card>
        <Card title="Profit margin by business" hint="Profit as a share of sales, each quarter">
          <ChartCanvas label="Profit margin by business" build={() => ({ type: 'line', data: { labels: QTRS, datasets: COMPANIES.map(c => ({ label: c.short, data: c.mar, borderColor: coC(c.id), backgroundColor: coC(c.id), tension: 0.3, pointRadius: 2.5, borderWidth: 2 })) }, options: baseOpts({ legend: true, y: v => v.toFixed(0) + '%', tip: c => ` ${c.dataset.label}: ${c.raw.toFixed(1)}%` }) })} />
        </Card>
      </div>
      <Card title="Profit and loss, last 12 months" hint="Select any sales figure to see the source rows." bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Business</th><th className="r">Sales</th><th className="r">Growth</th><th className="r">Book profit</th><th className="r">Margin</th><th className="r">Set aside this year</th><th className="r">True net profit</th><th className="r">Return on capital</th></tr></thead>
          <tbody>
            {ms.map(({ c, m }) => (
              <tr key={c.id}>
                <td><div className="co-cell"><CoDot id={c.id} />{c.short}</div></td>
                <td className="r"><Trace label={`${c.short}: sales, last 12 months`} value={m.ttmRev * CR} rows={plRows(c)}>{inr(m.ttmRev * CR)}</Trace></td>
                <td className="r"><Delta x={m.revGrowth} kind="pct" /></td>
                <td className="r">{inr(m.ttmProfit * CR)}</td>
                <td className="r">{pct(m.margin)}</td>
                <td className="r t-loss">−{inr(m.provCharge * CR)}</td>
                <td className="r" style={{ fontWeight: 600 }}>{inr(m.trueProfit * CR)}</td>
                <td className="r">{pct(m.trueRoce)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td>Family total</td><td className="r">{inr(ft.sales * CR)}</td><td /><td className="r">{inr(ft.bookProfit * CR)}</td><td className="r">{pct(ft.bookProfit / ft.sales)}</td><td className="r t-loss">−{inr((ft.bookProfit - ft.trueProfit) * CR)}</td><td className="r">{inr(ft.trueProfit * CR)}</td><td className="r">{pct(ft.trueProfit / COMPANIES.reduce((s, c) => s + c.capital, 0))}</td></tr></tfoot>
        </table>
      </Card>
    </>
  );
}

const A_LINES = [['cash', 'Cash and bank'], ['receivables', 'Due from customers'], ['inventory', 'Stock'], ['plant', 'Plant and machinery'], ['land', 'Land and buildings'], ['other', 'Other assets']];
const L_LINES = [['debt', 'Borrowings'], ['payables', 'Due to suppliers'], ['advances', 'Customer advances'], ['otherL', 'Other liabilities']];

function StatementsTab() {
  const ft = familyTotals();
  const famA = { cash: FAMILY.cash, receivables: 0, inventory: 0, plant: FAMILY.vehicles, land: ft.prop, other: ft.inv + FAMILY.gold };
  const famL = { debt: ft.personalLiab, payables: 0, advances: 0, otherL: 0 };
  const row = (k, l, fam) => (
    <tr key={k}>
      <td>{l}</td>
      {COMPANIES.map(c => <td className="r" key={c.id}><Trace label={`${c.short}: ${l}`} value={c.bs[k] * CR} rows={[bsRow(c, k, l.toLowerCase())]}>{inr(c.bs[k] * CR)}</Trace></td>)}
      <td className="r">{inr(fam[k] * CR)}</td>
      <td className="r" style={{ fontWeight: 600 }}>{inr((COMPANIES.reduce((s, c) => s + c.bs[k], 0) + fam[k]) * CR)}</td>
    </tr>
  );
  const sum = (ks, o) => ks.reduce((s, [k]) => s + o[k], 0);
  return (
    <Card title="Combined balance sheet, 30 September 2026" hint={'Each company\'s figures roll up into the family total. "Family" covers investments, property, cash and loans held outside the businesses.'} bodyClass="card-b tbl-wrap">
      <table className="tbl">
        <thead><tr><th>What we own</th>{COMPANIES.map(c => <th className="r" key={c.id}>{c.short}</th>)}<th className="r">Family</th><th className="r">Total</th></tr></thead>
        <tbody>
          {A_LINES.map(([k, l]) => row(k, l, famA))}
          <tr style={{ background: 'var(--card-2)' }}><td><b>Total assets</b></td>{COMPANIES.map(c => <td className="r" key={c.id}><b>{inr(metrics(c).assets * CR)}</b></td>)}<td className="r"><b>{inr(sum(A_LINES, famA) * CR)}</b></td><td className="r"><b>{inr(ft.assets * CR)}</b></td></tr>
          <tr><th colSpan={COMPANIES.length + 3} style={{ paddingTop: 20 }}>What we owe</th></tr>
          {L_LINES.map(([k, l]) => row(k, l, famL))}
          <tr style={{ background: 'var(--card-2)' }}><td><b>Total liabilities</b></td>{COMPANIES.map(c => <td className="r" key={c.id}><b>{inr(metrics(c).liab * CR)}</b></td>)}<td className="r"><b>{inr(ft.personalLiab * CR)}</b></td><td className="r"><b>{inr(ft.liab * CR)}</b></td></tr>
        </tbody>
        <tfoot><tr><td>Net worth</td>{COMPANIES.map(c => <td className="r" key={c.id}>{inr(metrics(c).equity * CR)}</td>)}<td className="r">{inr((ft.personalAssets - ft.personalLiab) * CR)}</td><td className="r">{inr(ft.nw * CR)}</td></tr></tfoot>
      </table>
    </Card>
  );
}

export default function Financials() {
  const [tab, setTab] = useTab('profit', ['profit', 'reserves', 'statements']);
  const [sel, setSel] = useState('all');
  return (
    <>
      <PageHead title="Financials" sub="Revenue, costs and profit across all the businesses, with the true profit left after setting money aside for obligations." />
      <Tabs value={tab} onChange={setTab} list={[['profit', 'Profit and margins'], ['reserves', 'Reserves and true profit'], ['statements', 'Statements']]} />
      {tab === 'profit' && <ProfitTab />}
      {tab === 'reserves' && <ReservesView sel={sel} setSel={setSel} />}
      {tab === 'statements' && <StatementsTab />}
    </>
  );
}
