import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { Icon } from '../components/Icon.jsx';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { ReservesView } from '../components/finance.jsx';
import { Callout, Card, Delta, Kpi, PageHead, Stats, Tabs, Tag, Trace, useTab } from '../components/ui.jsx';
import { CO, DOCS, MARKET, MONTHS12, QTRS } from '../lib/data.js';
import { CR, inr, pct, fmtDate, daysOld, cssv, alpha } from '../lib/format.js';
import { baseOpts } from '../lib/charts.js';
import { blankScenario, bsRow, metrics, mktChange, outlook, plRows, saveExtra, unregisterCompany } from '../lib/engine.js';

function OutlookTab({ c, m, o }) {
  const mk = MARKET[c.market.key], ch = mktChange(c.market.key);
  return (
    <>
      <div className="grid g2">
        <Card title="Sales and margin" hint="Quarterly sales (bars) and profit margin (line)">
          <ChartCanvas label="Sales and margin" deps={[c.id]} build={() => {
            const o2 = baseOpts(); const acc = cssv('--accent'), mut = cssv('--muted');
            o2.scales.y1 = { position: 'right', grid: { display: false }, border: { display: false }, ticks: { color: mut, font: { family: 'Geist Mono', size: 10.5 }, callback: v => v.toFixed(0) + '%' } };
            o2.plugins.tooltip.callbacks.label = x => (x.dataset.yAxisID === 'y1' ? ` Margin: ${x.raw.toFixed(1)}%` : ` Sales: ${inr(x.raw * CR)}`);
            return { data: { labels: QTRS, datasets: [{ type: 'bar', label: 'Sales', data: c.rev, backgroundColor: alpha(acc, 0.75), borderRadius: 4, maxBarThickness: 30 }, { type: 'line', label: 'Margin', data: c.mar, yAxisID: 'y1', borderColor: cssv('--ink'), backgroundColor: cssv('--ink'), pointRadius: 3, tension: 0.3, borderWidth: 2 }] }, options: o2 };
          }} />
        </Card>
        <Card title="Debt and stock days" hint="Borrowings (bars) and days to sell stock (line)">
          <ChartCanvas label="Debt and stock days" deps={[c.id]} build={() => {
            const o2 = baseOpts(); const acc = cssv('--accent'), mut = cssv('--muted');
            o2.scales.y1 = { position: 'right', grid: { display: false }, border: { display: false }, ticks: { color: mut, font: { family: 'Geist Mono', size: 10.5 }, callback: v => v + ' d' } };
            o2.plugins.tooltip.callbacks.label = x => (x.dataset.yAxisID === 'y1' ? ` Days to sell stock: ${x.raw}` : ` Debt: ${inr(x.raw * CR)}`);
            return { data: { labels: QTRS, datasets: [{ type: 'bar', label: 'Debt', data: c.debtHist, backgroundColor: alpha(acc, 0.35), borderColor: acc, borderWidth: 1, borderRadius: 4, maxBarThickness: 30 }, { type: 'line', label: 'Stock days', data: c.invDays, yAxisID: 'y1', borderColor: cssv('--warn'), backgroundColor: cssv('--warn'), pointRadius: 3, tension: 0.3, borderWidth: 2 }] }, options: o2 };
          }} />
        </Card>
      </div>
      <section className="card">
        <div className="card-h"><div><h3>Outlook: <Tag tone={o.tag} style={{ verticalAlign: 2 }}>{o.label}</Tag></h3><p className="hint">Trends in the company's own figures, combined with conditions in its market.</p></div></div>
        <div className="card-b"><div className="reason-cols">
          <div><h5>Inside the business</h5><ul>{o.inside.map(x => <li key={x}>{x}</li>)}</ul></div>
          <div><h5>Outside the business</h5><ul>{o.outside.map(x => <li key={x}>{x}</li>)}</ul></div>
        </div></div>
      </section>
      <div className="grid g2">
        <Card title={c.market.label} hint={`${mk.unit}, last 12 months. Sample figures.`}
          actions={<span className={`delta ${ch * c.market.sens >= 0 ? 'up' : 'down'}`}>{ch >= 0 ? '↑ +' : '↓ −'}{Math.abs(ch * 100).toFixed(1)}%</span>}>
          <ChartCanvas size="sm" label={`${mk.n} price`} deps={[c.id]} build={() => {
            const acc = cssv('--accent'); const o3 = baseOpts({ y: v => v.toLocaleString('en-IN'), tip: x => ` ${x.raw.toLocaleString('en-IN')} ${mk.unit}` }); o3.scales.y.beginAtZero = false;
            return { type: 'line', data: { labels: MONTHS12, datasets: [{ label: mk.n, data: mk.s, borderColor: acc, backgroundColor: alpha(acc, 0.1), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }] }, options: o3 };
          }} />
        </Card>
        <Card title="Concentration" hint="How much the business depends on one input or one buyer">
          <Stats items={[
            [`${c.rawName} as share of costs`, pct(c.rawDep, 0), c.rawDep > 0.7 ? 't-warn' : ''],
            [`Largest buyer: ${c.topCustName}`, pct(c.topCust, 0), c.topCust > 0.3 ? 't-warn' : ''],
            ['Days for cash to come back', c.cashDays],
            ['Debt to net assets', m.de.toFixed(2)],
          ]} />
        </Card>
      </div>
    </>
  );
}

function FactoriesTab({ c, m }) {
  return (
    <>
      <Card title="Units" hint={`Each unit rolls up into ${c.short}, and from there into the family view.`} bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Unit</th><th>Makes</th><th className="r">Staff</th><th className="r">Sales, 12 months</th><th className="r">Book profit</th><th className="r">Share</th><th>Source</th></tr></thead>
          <tbody>{c.factories.map(f => { const d = DOCS.find(x => x.id === f.doc) || DOCS.find(x => x.id === c.bsDoc); return (
            <tr key={f.n}>
              <td><b>{f.n}</b></td><td className="t-muted">{f.what}</td><td className="r">{f.staff}</td>
              <td className="r"><Trace label={`${f.n}: sales`} value={m.ttmRev * f.rev * CR} rows={[{ doc: d.file, sheet: 'Profit and Loss', row: 12, desc: `${f.n}: sales, last 12 months`, amt: m.ttmRev * f.rev * CR, date: d.date }]}>{inr(m.ttmRev * f.rev * CR)}</Trace></td>
              <td className="r">{inr(m.ttmProfit * f.rev * CR)}</td>
              <td className="r"><span className="score-bar" style={{ margin: '0 8px 0 0', width: 60 }}><i style={{ width: `${f.rev * 100}%` }} /></span>{pct(f.rev, 0)}</td>
              <td className="small t-muted">{d.file}</td>
            </tr>); })}
          </tbody>
        </table>
      </Card>
      <Card title="Machinery and buildings" hint="Age against expected life, used for the replacement fund" bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Asset</th><th className="r">Cost</th><th className="r">Age</th><th className="r">Expected life</th><th>Life used</th></tr></thead>
          <tbody>{c.assets.map(a => (
            <tr key={a.n}><td>{a.n}</td><td className="r">{inr(a.cost * CR)}</td><td className="r">{a.age} yrs</td><td className="r">{a.life} yrs</td>
              <td><div className="cover"><span className="cover-bar" style={{ width: 110 }}><i style={{ width: `${Math.min(1, a.age / a.life) * 100}%`, background: a.age / a.life > 0.75 ? 'var(--warn)' : 'var(--accent)' }} /></span><span className="num small">{Math.round(a.age / a.life * 100)}%</span></div></td></tr>
          ))}</tbody>
        </table>
      </Card>
    </>
  );
}

function BalanceTab({ c, m }) {
  const items = [['cash', 'Cash and bank'], ['receivables', 'Due from customers'], ['inventory', 'Stock'], ['plant', 'Plant and machinery'], ['land', 'Land and buildings'], ['other', 'Other assets']];
  const li = [['debt', 'Borrowings'], ['payables', 'Due to suppliers'], ['advances', 'Customer advances'], ['otherL', 'Other liabilities']].filter(([k]) => c.bs[k] > 0);
  const cell = ([k, l]) => <tr key={k}><td>{l}</td><td className="r"><Trace label={`${c.short}: ${l.toLowerCase()}`} value={c.bs[k] * CR} rows={[bsRow(c, k, l.toLowerCase())]}>{inr(c.bs[k] * CR)}</Trace></td></tr>;
  const rising = c.invDays.filter((v, i) => i && v > c.invDays[i - 1]).length;
  return (
    <div className="grid g2">
      <Card title="Balance sheet" bodyClass="card-b tbl-wrap">
        <table className="tbl"><tbody>
          {items.map(cell)}
          <tr><td><b>Total assets</b></td><td className="r"><b>{inr(m.assets * CR)}</b></td></tr>
          {li.map(cell)}
          <tr><td><b>Total liabilities</b></td><td className="r"><b>{inr(m.liab * CR)}</b></td></tr>
        </tbody><tfoot><tr><td>Net assets</td><td className="r">{inr(m.equity * CR)}</td></tr></tfoot></table>
      </Card>
      <Card title="Stock and raw material" hint="What is held and what it costs to hold" bodyStyle={{ display: 'grid', gap: 16 }}>
        <Stats items={[
          ['Stock value', inr(c.bs.inventory * CR)],
          ['Days to sell', c.invDays[7]],
          ['Cost of holding a year', inr(c.bs.inventory * (c.rate + 0.01) * CR)],
          ['Main raw material', <span key="r" style={{ fontFamily: 'var(--f-ui)', fontSize: 14 }}>{c.rawName}</span>],
        ]} />
        <p className="note">Holding cost uses the company's borrowing rate of {pct(c.rate)} plus about 1% for storage and insurance.{c.id === 'jj' && ` Days to sell has risen in ${rising} of the last seven quarters.`}</p>
        {c.id === 'jj' && <Callout tone="warn">The stock register was last imported on {fmtDate('2026-07-27')}, {daysOld('2026-07-27')} days before the sample data date. Stock figures may be out of date.</Callout>}
      </Card>
    </div>
  );
}

function DocsTab({ c }) {
  const navigate = useNavigate();
  const docs = DOCS.filter(d => d.co === c.id || d.co === 'all');
  return (
    <Card title="Documents" hint="Original files are stored untouched. The platform reads them and keeps a link to every row it uses." bodyClass="card-b tbl-wrap"
      actions={<button className="btn sm" onClick={() => navigate('/data-import')}><Icon name="upload" /> Import files</button>}>
      <table className="tbl">
        <thead><tr><th>File</th><th>Type</th><th>Unit</th><th className="r">Rows read</th><th>Imported</th></tr></thead>
        <tbody>{docs.map(d => { const a = daysOld(d.date); return (
          <tr key={d.id}><td><span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><Icon name="file" style={{ width: 15, height: 15, stroke: 'var(--muted)', flex: 'none' }} />{d.file}</span></td>
            <td>{d.type}</td><td className="t-muted">{d.unit}</td><td className="r">{d.rows.toLocaleString('en-IN')}</td>
            <td>{fmtDate(d.date)} {a > 45 && <span className="delta warn">{a} days old</span>}</td></tr>); })}
        </tbody>
      </table>
    </Card>
  );
}

function RemoveConfirm({ c }) {
  const { closeDrawer, bump, toast, setSc } = useApp();
  const navigate = useNavigate();
  const remove = () => {
    const n = c.name;
    unregisterCompany(c.id); saveExtra(); closeDrawer(); setSc(blankScenario()); bump();
    navigate('/businesses'); toast(`${n} removed`);
  };
  return (
    <>
      <p>This removes {c.name} and the figures entered for it from every page in Meridian. The four original businesses are not affected.</p>
      <div className="row"><button className="btn" style={{ background: 'var(--loss)' }} onClick={remove}><Icon name="close" /> Remove</button><button className="btn ghost" onClick={closeDrawer}>Keep it</button></div>
    </>
  );
}

export default function Company() {
  const { id } = useParams();
  const { openDrawer, setSc } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useTab('overview', ['overview', 'factories', 'balance', 'reserves', 'docs']);
  const [sel, setSel] = useState(id);
  const c = CO[id];
  if (!c) return <Navigate to="/businesses" replace />;
  const m = metrics(c), o = outlook(c, m);
  const testChange = () => { const s = blankScenario(); s.growth.on = true; setSc(s); navigate('/resource-allocation?tab=whatif'); };
  return (
    <>
      <PageHead title={<span className="row" style={{ gap: 10 }}>{c.name}<Tag tone={o.tag}>{o.label}</Tag></span>}
        sub={`${c.industry}. ${c.factories.length} unit${c.factories.length === 1 ? '' : 's'}. Sample figures to 30 September 2026.`}>
        <div className="row">
          <button className="btn ghost sm" onClick={testChange}><Icon name="move" /> Test a change</button>
          {c.custom && <button className="btn ghost sm" onClick={() => openDrawer('Remove business', c.name, <RemoveConfirm c={c} />)}><Icon name="close" /> Remove business</button>}
        </div>
      </PageHead>
      {c.custom && <Callout>These figures were entered by hand. Stock, amounts due, staff benefits and reserves are estimated from them until this business's balance sheet and ledgers are imported.</Callout>}
      <div className="grid g4">
        <Kpi label="Sales, last 12 months" value={<Trace label={`${c.short}: sales`} value={m.ttmRev * CR} rows={plRows(c)}>{inr(m.ttmRev * CR)}</Trace>} foot={<><Delta x={m.revGrowth} kind="pct" /><span>on the year before</span></>} />
        <Kpi label="True net profit" value={inr(m.trueProfit * CR)} foot={<span>Book profit {inr(m.ttmProfit * CR)}</span>} />
        <Kpi label="Cash" value={<Trace label={`${c.short}: cash`} value={c.bs.cash * CR} rows={[bsRow(c, 'cash', 'cash and bank balances')]}>{inr(c.bs.cash * CR)}</Trace>}
          foot={<><span className={`delta ${m.months < 2 ? 'warn' : 'flat'}`}>{m.months.toFixed(1)} months</span><span>of running costs</span></>} />
        <Kpi label="Debt" value={<Trace label={`${c.short}: borrowings`} value={c.bs.debt * CR} rows={[bsRow(c, 'debt', 'borrowings')]}>{inr(c.bs.debt * CR)}</Trace>}
          foot={<><Delta x={m.debtChange} kind="pct" invert d={0} /><span>in a year, at {pct(c.rate)}</span></>} />
      </div>
      <Tabs value={tab} onChange={setTab} list={[['overview', 'Outlook'], ['factories', 'Factories'], ['balance', 'Balance sheet and stock'], ['reserves', 'Reserves'], ['docs', 'Documents']]} />
      {tab === 'overview' && <OutlookTab c={c} m={m} o={o} />}
      {tab === 'factories' && <FactoriesTab c={c} m={m} />}
      {tab === 'balance' && <BalanceTab c={c} m={m} />}
      {tab === 'reserves' && <ReservesView sel={c.id} setSel={setSel} inCompany key={sel} />}
      {tab === 'docs' && <DocsTab c={c} />}
    </>
  );
}
