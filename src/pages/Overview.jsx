import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { SuggestCard } from '../components/finance.jsx';
import { Card, Delta, Empty, HBar, Kpi, Kv, PageHead, Tag } from '../components/ui.jsx';
import { COMPANIES, DOCS } from '../lib/data.js';
import { CR, inr, pct, cssv, alpha, crTick, greeting, today } from '../lib/format.js';
import { baseOpts } from '../lib/charts.js';
import { familyTotals, metrics, outlook, simulate, blankScenario, suggestedScenario, suggestions, traceFor } from '../lib/engine.js';

export default function Overview() {
  const { showTrace, version, profile } = useApp();
  const navigate = useNavigate();
  const ft = familyTotals();
  const sugg = suggestions(), s0 = sugg[0];
  const ms = COMPANIES.map(c => ({ c, m: metrics(c) }));
  const b = simulate(blankScenario()), s = simulate(suggestedScenario()), hasChange = sugg.some(x => x.sc);
  const bv = [ft.nw, ...b.yearly.slice(0, 5).map(y => y.nw)], sv = [ft.nw, ...s.yearly.slice(0, 5).map(y => y.nw)];
  const rows = [...ms.map(x => ({ id: x.c.id, n: x.c.short, v: x.m.equity, o: outlook(x.c, x.m) })), ...(ft.personalAssets || ft.personalLiab ? [{ id: 'fam', n: 'Family holdings', v: ft.personalAssets - ft.personalLiab }] : [])];

  return (
    <>
      <PageHead greet title={profile.name ? `${greeting()}, ${profile.name}` : greeting()} sub="Your Financial Command Centre">
        <div className="head-meta">
          <span>{today()}</span>
          <span className="pill-sync"><span className="dot" /> {DOCS.length} file{DOCS.length === 1 ? '' : 's'} imported</span>
        </div>
      </PageHead>
      <div className="grid g4">
        <Kpi lead label="Total net worth" icon="link" onClick={() => showTrace(traceFor('nw'))}
          value={<>₹{ft.nw.toFixed(2)}<span className="unit"> Cr</span></>}
          foot={<span>assets less liabilities</span>} />
        <Kpi label="Total cash" icon="link" onClick={() => showTrace(traceFor('cash'))} value={inr(ft.cash * CR)}
          foot={<><span className={`delta ${ft.cash / ft.fixedMonthly < 2 ? 'warn' : 'flat'}`}>{(ft.cash / ft.fixedMonthly).toFixed(1)} months</span><span>of running costs covered</span></>} />
        <Kpi label="Total assets" icon="link" onClick={() => showTrace(traceFor('assets'))} value={inr(ft.assets * CR)} foot={<span>{inr(ft.coAssets * CR)} in the businesses</span>} />
        <Kpi label="Total liabilities" icon="link" onClick={() => showTrace(traceFor('liab'))} value={inr(ft.liab * CR)}
          foot={<><Delta x={COMPANIES.reduce((a, c) => a + c.debtHist[7] - c.debtHist[3], 0) * CR} invert /><span>business debt this year</span></>} />
      </div>
      <div className="grid g-main">
        <Card title="Net worth over the next five years" hint="Where net worth is heading on the current path, and with the suggested change when there is one. True profit after provisions is used throughout."
          actions={<div className="legend"><span><i className="dash" style={{ background: 'var(--muted)' }} />Current path</span>{hasChange && <span><i style={{ background: 'var(--accent)' }} />With suggested change</span>}</div>}>
          <ChartCanvas size="lg" label="Projected net worth chart" deps={[version]} build={() => {
            const acc = cssv('--accent'), mut = cssv('--muted');
            return { type: 'line', data: { labels: ['Today', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'], datasets: [
              ...(hasChange ? [{ label: 'With suggested change', data: sv, borderColor: acc, backgroundColor: alpha(acc, 0.12), fill: '+1', tension: 0.35, pointRadius: [0, 0, 0, 0, 0, 4], pointBackgroundColor: acc, borderWidth: 2.4 }] : []),
              { label: 'Current path', data: bv, borderColor: mut, borderDash: [5, 4], tension: 0.35, pointRadius: 0, borderWidth: 1.6, fill: false },
            ] }, options: baseOpts({ y: crTick }) };
          }} />
          <p className="note mt">{hasChange ? <>Following the suggestions adds about <b className="t-gain">↑ {inr((sv[5] - bv[5]) * CR)}</b> by year 5, reaching {inr(sv[5] * CR)} against {inr(bv[5] * CR)} on the current path.</> : <>On the current path, net worth reaches {inr(bv[5] * CR)} by year 5.</>}</p>
        </Card>
        <Card title="Net worth by business" hint="Assets less liabilities. Select a business to open it.">
          <HBar rows={rows.map(r => ({ key: r.id, n: r.n, dot: r.id, v: r.v, color: `var(--c-${r.id})`, label: inr(r.v * CR), sub: pct(r.v / ft.nw, 0),
            extra: r.o && <Tag tone={r.o.tag} style={{ fontSize: 10.5, padding: '1px 7px' }}>{r.o.label}</Tag>,
            onClick: () => navigate(r.id === 'fam' ? '/investments' : `/businesses/${r.id}`) }))} />
          <div className="divider" style={{ margin: '16px 0 12px' }} />
          <Kv items={[
            ['Profit in the books, last 12 months', inr(ft.bookProfit * CR)],
            ['True net profit after provisions', <b key="t" style={{ color: 'var(--ink)' }}>{inr(ft.trueProfit * CR)}</b>],
            ['Difference set aside for obligations', '−' + inr((ft.bookProfit - ft.trueProfit) * CR), 't-loss'],
          ]} />
        </Card>
      </div>
      <Card title="Suggested change" hint={s0 ? `The strongest of ${sugg.length} suggestion${sugg.length === 1 ? '' : 's'} right now. These support your decision; they are not instructions.` : 'Suggestions appear when the figures point to a clear change.'}>
        {s0 ? <SuggestCard s={s0} compact /> : <Empty>No suggestions yet. With more businesses, or more detailed figures, Meridian compares them and points out where money could work harder.</Empty>}
      </Card>
    </>
  );
}
