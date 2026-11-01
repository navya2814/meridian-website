import { useState } from 'react';
import { Callout, Card, Empty, PageHead, Seg, Spark } from '../components/ui.jsx';
import { COMPANIES, FAMILY, MARKET } from '../lib/data.js';
import { CR, inr, pct, cssv } from '../lib/format.js';
import { alertsList, familyTotals, mktChange, ranking } from '../lib/engine.js';

/** Strengths, weaknesses, risks and opportunities, each written from the figures currently entered. */
function buildGroups(rk, ft) {
  const best = rk[0], worst = rk[rk.length - 1], many = rk.length > 1;
  const strengths = [], weaknesses = [], risks = [], opportunities = [];
  rk.forEach(({ c, m }) => {
    if (m.trueRoce > 0.15) strengths.push(`${c.short} earns ${pct(m.trueRoce)} on capital after provisions${m.revGrowth > 0.02 ? ` and has grown sales ${pct(m.revGrowth)}` : ''}.`);
    if (m.debtChange < -0.05) strengths.push(`${c.short} has cut its debt by ${pct(-m.debtChange, 0)} in a year.`);
    if (m.trueRoce < 0.05) weaknesses.push(`${c.short} ties up ${inr(c.capital * CR)} of capital for a ${pct(m.trueRoce)} return after provisions.`);
    if (m.margin < 0.05 && m.margin > 0) weaknesses.push(`${c.short} makes only ${pct(m.margin)} on sales, so small price moves swing its profit.`);
    if (m.de > 1.5) risks.push(`${c.short} owes ${m.de.toFixed(2)} times its net assets.`);
    if (!c.custom && c.topCust > 0.3) risks.push(`${pct(c.topCust, 0)} of ${c.short}'s sales come from ${c.topCustName.toLowerCase()}.`);
  });
  const inv = ft.inv;
  if (inv > 0) strengths.push(`Personal investments of ${inr(inv * CR)} returned about ${pct(FAMILY.investments.reduce((s, x) => s + x.val * x.ret1y, 0) / inv)} in a year.`);
  if (ft.bookProfit > 0) weaknesses.push(`True net profit is ${pct(ft.trueProfit / ft.bookProfit, 0)} of book profit once obligations are counted.`);
  const stock = COMPANIES.reduce((s, c) => s + c.bs.inventory, 0);
  if (ft.assets > 0 && stock / ft.assets > 0.3) risks.push(`${pct(stock / ft.assets, 0)} of family assets is business stock, so a fall in its value hits net worth directly.`);
  if (many && best.c.id !== worst.c.id && worst.roce < best.roce - 0.02) opportunities.push(`${worst.c.short} earns less on its capital than ${best.c.short}. Moving some capital across could raise true profit (see Resource Allocation).`);
  return [
    ['Strengths', 'gain', strengths],
    ['Weaknesses', 'loss', weaknesses],
    ['Risks', 'warn', risks],
    ['Opportunities', 'info', opportunities],
  ];
}

export default function Insights() {
  const [sev, setSev] = useState('all');
  const ft = familyTotals();
  const rk = ranking();
  const alerts = alertsList();
  const shown = sev === 'all' ? alerts : alerts.filter(a => (sev === 'urgent' ? a.s === 'loss' : sev === 'watch' ? a.s === 'warn' : a.s === 'gain' || a.s === 'info'));
  const groups = buildGroups(rk, ft);
  const group = ([n, s, xs]) => (
    <section className="card" key={n}><div className="card-h"><h3 className="row" style={{ gap: 8 }}><span className={`sev ${s}`} style={{ height: 14 }} />{n}</h3></div>
      <div className="card-b">{xs.length ? <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>{xs.map(x => <li key={x}>{x}</li>)}</ul> : <p className="note">Nothing stands out here yet.</p>}</div></section>
  );
  const priced = Object.entries(MARKET).filter(([, m]) => m.s.length > 1);
  return (
    <>
      <PageHead title="Insights" sub="What stands out in the figures. Each point is worked out from the businesses and holdings entered in Meridian." />
      <div className="grid g-main">
        <Card title="Alerts" hint="Low cash, rising debt, unfunded obligations, big price moves and out-of-date files"
          actions={<Seg label="Filter alerts" value={sev} onChange={setSev} options={[['all', `All ${alerts.length}`], ['urgent', 'Urgent'], ['watch', 'Watch'], ['other', 'Other']]} />}>
          {shown.length
            ? <div className="list">{shown.map(a => <div className="list-row" key={a.t}><span className={`sev ${a.s}`} /><div style={{ minWidth: 0 }}><div className="t">{a.t}</div><div className="d">{a.d}</div></div><span className="when">{a.w}</span></div>)}</div>
            : <Empty>No alerts. Nothing in the current figures needs attention.</Empty>}
        </Card>
        <div className="grid" style={{ alignContent: 'start' }}>{groups.slice(0, 2).map(group)}</div>
      </div>
      <div className="grid g2">{groups.slice(2).map(group)}</div>
      <Card title="Market prices that move the businesses" hint="Prices for the materials your businesses depend on">
        {priced.length ? (
          <div className="mkt">{priced.map(([k, m]) => { const ch = mktChange(k); return (
            <div className="mkt-card" key={k}><span className="n">{m.n}</span>
              <span className="p">{m.s[m.s.length - 1].toLocaleString('en-IN')} <span className="t-muted small" style={{ fontFamily: 'var(--f-ui)' }}>{m.unit}</span></span>
              <span><span className="delta flat">{ch >= 0 ? '↑ +' : '↓ −'}{Math.abs(ch * 100).toFixed(1)}%</span> <span className="small t-muted">in a year</span></span>
              <Spark vals={m.s} color={cssv('--accent') || '#C9A24B'} w={160} h={32} />
            </div>); })}
          </div>
        ) : <Empty>No price feed is connected, so no market prices are shown and market moves are left out of the outlook and advice.</Empty>}
      </Card>
      <Callout>Insights update as you add businesses and import files. Figures entered by hand are partly estimated, so treat them as a guide until the real books are imported.</Callout>
    </>
  );
}
