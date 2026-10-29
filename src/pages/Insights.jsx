import { useState } from 'react';
import { Callout, Card, PageHead, Seg, Spark } from '../components/ui.jsx';
import { CO, FAMILY, MARKET } from '../lib/data.js';
import { CR, inr, pct, cssv } from '../lib/format.js';
import { alertsList, familyTotals, metrics, mktChange, ranking } from '../lib/engine.js';

export default function Insights() {
  const [sev, setSev] = useState('all');
  const ft = familyTotals();
  const mh = metrics(CO.hyg), mj = metrics(CO.jj), mo = metrics(CO.oil);
  ranking();
  const alerts = alertsList();
  const shown = sev === 'all' ? alerts : alerts.filter(a => (sev === 'urgent' ? a.s === 'loss' : sev === 'watch' ? a.s === 'warn' : a.s === 'gain' || a.s === 'info'));
  const groups = [
    ['Strengths', 'gain', [`Himgiri Hygiene earns ${pct(mh.trueRoce)} on capital after provisions and has grown sales ${pct(mh.revGrowth)} with falling debt.`, `Personal investments of ${inr(ft.inv * CR)} returned about ${pct(FAMILY.investments.reduce((s, x) => s + x.val * x.ret1y, 0) / ft.inv)} in a year.`, 'Bengal Jute Mills has cut debt for eight quarters running.']],
    ['Weaknesses', 'loss', [`JJ Jewelers ties up ${inr(CO.jj.capital * CR)} of capital for a ${pct(mj.trueRoce)} return after provisions.`, `Eastern Edible Oils makes only ${pct(mo.margin)} on sales, so small price moves swing its profit.`, `True net profit is ${pct(ft.trueProfit / ft.bookProfit, 0)} of book profit once obligations are counted.`]],
    ['Risks', 'warn', [`${pct(CO.jj.bs.inventory / ft.assets, 0)} of family assets is jewellery stock, so a fall in gold hits net worth directly.`, `${pct(CO.jute.topCust, 0)} of jute sales come from government orders and ${pct(CO.oil.topCust, 0)} of oil sales from one retail chain.`, `Two cash-credit limits worth ${inr(19.8 * CR)} come up for renewal in the next four months.`]],
    ['Opportunities', 'info', [`Raw jute is near its seasonal low. Buying three months of stock now could save about ${inr(0.31 * CR)}.`, 'Moving slow capital from jewellery to hygiene would raise family true profit (see Resource Allocation).', 'Repaying 10% debt with 7% deposits saves money every year.']],
    ['Unusual patterns', 'warn', ['Guwahati power cost jumped 64% in September with no rise in output.', 'JJ Jewelers sales in Q2 FY27 rose but margin fell, which suggests heavier discounting.', 'Eastern Edible Oils stock days rose for five of the last eight quarters.']],
  ];
  const group = ([n, s, xs]) => (
    <section className="card" key={n}><div className="card-h"><h3 className="row" style={{ gap: 8 }}><span className={`sev ${s}`} style={{ height: 14 }} />{n}</h3></div>
      <div className="card-b"><ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>{xs.map(x => <li key={x}>{x}</li>)}</ul></div></section>
  );
  return (
    <>
      <PageHead title="Insights" sub="What stands out in the data this month. Each point comes from the imported figures." />
      <div className="grid g-main">
        <Card title="Alerts" hint="Low cash, rising debt, unusual costs, low stock and big price moves"
          actions={<Seg label="Filter alerts" value={sev} onChange={setSev} options={[['all', `All ${alerts.length}`], ['urgent', 'Urgent'], ['watch', 'Watch'], ['other', 'Other']]} />}>
          <div className="list">{shown.map(a => <div className="list-row" key={a.t}><span className={`sev ${a.s}`} /><div style={{ minWidth: 0 }}><div className="t">{a.t}</div><div className="d">{a.d}</div></div><span className="when">{a.w}</span></div>)}</div>
        </Card>
        <div className="grid" style={{ alignContent: 'start' }}>{groups.slice(0, 2).map(group)}</div>
      </div>
      <div className="grid g3">{groups.slice(2).map(group)}</div>
      <Card title="Market prices that move the businesses" hint="Sample figures for illustration. Connect a live price feed to replace them.">
        <div className="mkt">{Object.entries(MARKET).map(([k, m]) => { const ch = mktChange(k); return (
          <div className="mkt-card" key={k}><span className="n">{m.n}</span>
            <span className="p">{m.s[11].toLocaleString('en-IN')} <span className="t-muted small" style={{ fontFamily: 'var(--f-ui)' }}>{m.unit}</span></span>
            <span><span className="delta flat">{ch >= 0 ? '↑ +' : '↓ −'}{Math.abs(ch * 100).toFixed(1)}%</span> <span className="small t-muted">in a year</span></span>
            <Spark vals={m.s} color={cssv('--accent') || '#C9A24B'} w={160} h={32} />
          </div>); })}
        </div>
      </Card>
      <Callout>Insights are written from the sample data in this build. Once real books are imported, they update with the actual figures.</Callout>
    </>
  );
}
