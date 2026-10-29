// Finance-specific components used on more than one page.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { Icon } from './Icon.jsx';
import ChartCanvas from './ChartCanvas.jsx';
import { Callout, CoDot, Card, Delta, HBar, Seg, SourceRow, Tag, Trace } from './ui.jsx';
import { CO, COMPANIES, DOCS, FUND_META, MARKET } from '../lib/data.js';
import { CR, inr, pct, fmtDate, daysOld, coC, alpha, clone, DATA_AS_OF } from '../lib/format.js';
import { baseOpts } from '../lib/charts.js';
import {
  metrics, suggestions, fundRows, RULES, OVERRIDES, MAX_COS, PALETTE, buildCompany, registerCompany, saveExtra,
} from '../lib/engine.js';

/* ---------- Advice card ---------- */
export function SuggestCard({ s, compact }) {
  const { openDrawer, setSc } = useApp();
  const navigate = useNavigate();
  const c = CO[s.co];
  const showUsed = () => openDrawer('Data behind this advice', s.what, (
    <>
      <p className="note">Check these files to verify the numbers in the reasons.</p>
      {s.used.map(id => { const d = DOCS.find(x => x.id === id); const age = daysOld(d.date); return <SourceRow key={id} d={d} extra={age > 45 ? <> · <b className="t-warn">{age} days old</b></> : null} />; })}
      <div className="divider" />
      <div className="note">Market prices: sample figures for gold, crude palm oil, Brent crude, raw jute and fluff pulp, last 12 months.</div>
    </>
  ));
  const tryIt = () => { setSc(clone(s.sc)); navigate('/resource-allocation?tab=whatif'); };
  return (
    <div className="suggest">
      <div className="row" style={{ gap: 8 }}>
        <Tag tone={s.kind === 'Pull back' ? 'risk' : s.kind === 'Hold' ? 'stable' : 'growing'}>{s.kind}</Tag>
        <span className="row small t-muted" style={{ gap: 6 }}>
          <CoDot id={s.co} />{c.short}
          {s.to && <> <span aria-hidden="true">→</span> <CoDot id={s.to} />{CO[s.to].short}</>}
        </span>
      </div>
      <div className="what">{s.what}</div>
      <div className="reason-cols">
        <div><h5>Inside the business</h5><ul>{s.inside.map(x => <li key={x}>{x}</li>)}</ul></div>
        <div><h5>Outside the business</h5><ul>{s.outside.map(x => <li key={x}>{x}</li>)}</ul></div>
      </div>
      {!compact && (
        <div className="grid g3" style={{ gap: 12 }}>
          <div className="note box"><b style={{ color: 'var(--ink)' }}>Money affected</b><br />{s.money}</div>
          <div className="note box"><b style={{ color: 'var(--gain)' }}>↑ If you follow it</b><br />{s.effect}</div>
          <div className="note box"><b style={{ color: 'var(--loss)' }}>↓ If you don't</b><br />{s.risk}</div>
        </div>
      )}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="conf">Confidence <span className="conf-bar"><i style={{ width: `${s.conf * 100}%` }} /></span><b className="num" style={{ color: 'var(--ink)' }}>{Math.round(s.conf * 100)}%</b></div>
        <div className="row" style={{ gap: 8 }}>
          {compact
            ? <button className="btn ghost sm" onClick={() => navigate('/resource-allocation')}>See all advice <Icon name="arrowR" /></button>
            : <>{s.sc && <button className="btn sm" onClick={tryIt}><Icon name="move" /> Try in What If</button>}<button className="btn ghost sm" onClick={showUsed}><Icon name="file" /> Data used</button></>}
        </div>
      </div>
      {!compact && s.gaps.length > 0 && <Callout tone="warn"><b>Missing or out-of-date data.</b> {s.gaps.join(' ')}</Callout>}
    </div>
  );
}

/* ---------- Reserves and true profit ---------- */
const covColor = r => (r >= 0.9 ? 'var(--gain)' : r >= 0.6 ? 'var(--warn)' : 'var(--loss)');

function OverrideForm({ c, k }) {
  const { closeDrawer, bump, toast } = useApp();
  const x = metrics(c).funds[k];
  const [amt, setAmt] = useState((x.need * 100).toFixed(1));
  const [note, setNote] = useState(x.override ? x.override.note : '');
  const [by, setBy] = useState(x.override ? x.override.by : 'R. Agarwal, Chief Accountant');
  const [err, setErr] = useState('');
  const save = () => {
    const a = parseFloat(amt);
    if (isNaN(a) || a < 0) return setErr('Enter an amount in lakh, for example 120.');
    if (!note.trim()) return setErr('Add a short reason so others can see why the rule was changed.');
    OVERRIDES[`${c.id}.${k}`] = { amt: a / 100, note: note.trim(), by: by.trim() || 'Accountant', date: DATA_AS_OF };
    closeDrawer(); bump(); toast('Override saved. True net profit updated.');
  };
  const clear = () => { delete OVERRIDES[`${c.id}.${k}`]; closeDrawer(); bump(); toast('Override removed'); };
  return (
    <>
      <div className="note box"><b>Calculated amount: {inr(x.auto * CR)}</b><br />{x.why}</div>
      <div className="field"><label htmlFor="ovAmt">New amount needed (₹ lakh)</label><input id="ovAmt" className="input num" type="number" min="0" step="0.5" value={amt} onChange={e => setAmt(e.target.value)} /></div>
      <div className="field"><label htmlFor="ovNote">Reason (required)</label><textarea id="ovNote" className="input" rows="3" value={note} onChange={e => setNote(e.target.value)} placeholder="For example: actuarial valuation dated 30 Sep gives a lower figure" /></div>
      <div className="field"><label htmlFor="ovBy">Entered by</label><input id="ovBy" className="input" value={by} onChange={e => setBy(e.target.value)} /></div>
      {err && <p className="note" style={{ color: 'var(--loss)' }}>{err}</p>}
      <div className="row"><button className="btn" onClick={save}><Icon name="check" /> Save override</button>{x.override && <button className="btn ghost" onClick={clear}>Remove override</button>}</div>
    </>
  );
}

function CompanyFunds({ c }) {
  const { openDrawer } = useApp();
  const m = metrics(c), f = m.funds;
  return (
    <section className="card">
      <div className="card-h">
        <div><h3 className="row" style={{ gap: 8 }}><CoDot id={c.id} />{c.name}</h3><p className="hint">Needed {inr(m.totalNeed * CR)} · set aside {inr(m.totalSet * CR)} · charged against this year's profit {inr(m.provCharge * CR)}</p></div>
        <div className="row" style={{ gap: 16 }}>
          <div className="small t-muted">Book profit <b className="num" style={{ color: 'var(--ink)' }}>{inr(m.ttmProfit * CR)}</b></div>
          <div className="small t-muted">True net profit <b className="num" style={{ color: 'var(--ink)' }}>{inr(m.trueProfit * CR)}</b></div>
          <Delta x={(m.trueProfit - m.ttmProfit) * CR} />
        </div>
      </div>
      <div className="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Fund</th><th>Covers</th><th className="r">Needed</th><th className="r">Set aside</th><th className="r">Shortfall</th><th>Coverage</th><th className="r">Charged this year</th><th /></tr></thead>
          <tbody>
            {Object.entries(f).map(([k, x]) => {
              const cov = x.need ? Math.min(1, x.set / x.need) : 1;
              const note = <>{x.override && <><b>Accountant override</b> by {x.override.by} on {fmtDate(x.override.date)}: {x.override.note}<br />Calculated amount was {inr(x.auto * CR)}. </>}<b>How it is calculated.</b> {x.why}</>;
              return (
                <tr className="fund-row" key={k}>
                  <td>{FUND_META[k].n}{x.override && <> <span className="chip">Override</span></>}</td>
                  <td className="t-muted small">{FUND_META[k].grp}</td>
                  <td className="r"><Trace label={`${c.short}: ${FUND_META[k].n} needed`} value={x.need * CR} rows={fundRows(c, k, x)} note={note}>{inr(x.need * CR)}</Trace></td>
                  <td className="r">{inr(x.set * CR)}</td>
                  <td className={`r ${x.short > 0 ? 't-loss' : 't-gain'}`}>{x.short > 0 ? '−' + inr(x.short * CR) : '✓ Funded'}</td>
                  <td><div className="cover"><span className="cover-bar"><i style={{ width: `${cov * 100}%`, background: covColor(cov) }} /></span><span className="num small">{Math.round(cov * 100)}%</span></div></td>
                  <td className="r">{inr(x.charge * CR)}</td>
                  <td><button className="btn ghost sm" onClick={() => openDrawer(`Override ${FUND_META[k].n.toLowerCase()}`, c.name, <OverrideForm c={c} k={k} />)}>Override</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReservesView({ sel, setSel, inCompany }) {
  const navigate = useNavigate();
  const all = COMPANIES.map(c => ({ c, m: metrics(c) }));
  const list = sel === 'all' || !CO[sel] ? COMPANIES : [CO[sel]];
  const flags = all.filter(x => x.m.unfunded.length);
  let largest = null;
  flags.forEach(x => x.m.unfunded.forEach(([k, f]) => { if (!largest || f.short > largest.s) largest = { s: f.short, n: FUND_META[k].n, c: x.c.short }; }));
  const catchWord = { 1: 'all', 2: 'half', 3: 'a third', 4: 'a quarter', 5: 'a fifth', 6: 'a sixth' }[RULES.catchUp] || `1/${RULES.catchUp}`;
  return (
    <>
      {!inCompany && (
        <>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <Seg label="Choose business" value={sel} onChange={setSel} options={[['all', 'All businesses'], ...COMPANIES.map(c => [c.id, c.short])]} />
            <button className="btn ghost sm" onClick={() => navigate('/settings')}><Icon name="settings" /> Adjust the rules</button>
          </div>
          <div className="grid g-side">
            <Card title="Book profit compared with true net profit" hint="Last 12 months. The gap is money that is already owed or likely to be needed.">
              <ChartCanvas label="Book profit and true net profit by business" build={() => {
                const o = baseOpts({ legend: true });
                return { type: 'bar', data: { labels: all.map(x => x.c.short), datasets: [
                  { label: 'Book profit', data: all.map(x => x.m.ttmProfit), backgroundColor: all.map(x => alpha(coC(x.c.id), 0.3)), borderColor: all.map(x => coC(x.c.id)), borderWidth: 1, borderRadius: 4, maxBarThickness: 40 },
                  { label: 'True net profit', data: all.map(x => x.m.trueProfit), backgroundColor: all.map(x => coC(x.c.id)), borderRadius: 4, maxBarThickness: 40 },
                ] }, options: o };
              }} />
            </Card>
            <Card title="How much profit is free to spend" hint="True net profit as a share of book profit">
              <HBar max={1} rows={all.map(({ c, m }) => ({ key: c.id, n: c.short, dot: c.id, v: Math.max(0, m.trueProfit / m.ttmProfit), color: `var(--c-${c.id})`, label: inr(m.trueProfit * CR), sub: `of ${inr(m.ttmProfit * CR)}`, onClick: () => setSel(c.id) }))} />
              {largest && <Callout tone="loss" style={{ marginTop: 16 }}><b>Promised benefits or likely costs exceed money set aside</b> in {flags.map(x => x.c.short).join(', ')}. Largest gap: {largest.n.toLowerCase()} at {largest.c}, {inr(largest.s * CR)} short.</Callout>}
            </Card>
          </div>
        </>
      )}
      {list.map(c => <CompanyFunds c={c} key={c.id} />)}
      <Callout>Default rules are estimates. True net profit takes this year's gratuity build-up, the full gap on bad debts, stock losses and pending pay, and {catchWord} of every other shortfall each year until it is closed. Final treatment must follow the accounting standards, tax rules and labour laws that apply to each company, and be confirmed by a qualified accountant.</Callout>
    </>
  );
}

/* ---------- Add a business ---------- */
export function AddBusinessForm() {
  const { closeDrawer, bump, toast } = useApp();
  const navigate = useNavigate();
  const used = COMPANIES.map(c => c.theme.main.toLowerCase());
  const free = PALETTE.filter(p => !used.includes(p.toLowerCase()));
  const pal = free.length ? free : PALETTE;
  const [f, setF] = useState({ name: '', industry: '', capital: '10', sales: '12', margin: '8', growth: '6', cash: '1', debt: '3', staff: '100', raw: '', market: 'crude', color: pal[0] });
  const [err, setErr] = useState('');
  const upd = k => e => setF({ ...f, [k]: e.target.value });
  const num = (k, label, step = '0.1', min = '0') => (
    <div className="field"><label htmlFor={`nb_${k}`}>{label}</label><input id={`nb_${k}`} className="input num" type="number" min={min} step={step} value={f[k]} onChange={upd(k)} /></div>
  );
  const save = () => {
    const name = f.name.trim();
    const v = k => parseFloat(f[k]);
    if (!name) return setErr('Enter the business name.');
    if (COMPANIES.some(c => c.name.toLowerCase() === name.toLowerCase())) return setErr('A business with this name is already in Meridian.');
    const rec = { id: 'b' + Date.now().toString(36), name, industry: f.industry.trim(), capital: v('capital'), sales: v('sales'), margin: v('margin'), growth: v('growth') / 100,
      cash: v('cash'), debt: v('debt'), staff: Math.round(v('staff')), raw: f.raw.trim(), market: f.market, color: f.color, added: DATA_AS_OF };
    if (!(rec.capital > 0)) return setErr('Capital invested must be more than zero.');
    if (!(rec.sales > 0)) return setErr('Sales a year must be more than zero.');
    if (isNaN(rec.margin) || rec.margin === 0 || rec.margin < -30 || rec.margin > 60) return setErr('Profit margin should be between −30% and 60%, and not exactly zero.');
    if (isNaN(rec.growth) || rec.growth < -0.2 || rec.growth > 0.5) return setErr('Sales growth should be between −20% and 50% a year.');
    if (isNaN(rec.cash) || rec.cash < 0 || isNaN(rec.debt) || rec.debt < 0) return setErr('Cash and bank loans cannot be negative.');
    if (!(rec.staff >= 0)) return setErr('Enter the number of staff, or 0.');
    if (COMPANIES.length >= MAX_COS) return setErr(`Meridian holds up to ${MAX_COS} businesses.`);
    registerCompany(buildCompany(rec)); saveExtra(); closeDrawer(); bump();
    toast(`${name} added. ${COMPANIES.length} of ${MAX_COS} businesses in use.`);
    navigate(`/businesses/${rec.id}`);
  };
  return (
    <>
      <p className="note">Enter the main figures. Meridian estimates the rest (stock, amounts due, staff benefits and reserves) from these until the real balance sheet is imported.</p>
      <div className="field"><label htmlFor="nb_name">Business name</label><input id="nb_name" className="input" maxLength={40} autoFocus placeholder="For example Himalayan Tea Estates" value={f.name} onChange={upd('name')} /></div>
      <div className="field"><label htmlFor="nb_ind">What it does</label><input id="nb_ind" className="input" maxLength={60} placeholder="For example tea growing and packing" value={f.industry} onChange={upd('industry')} /></div>
      <div className="row">{num('capital', 'Capital invested (₹ Cr)')}{num('sales', 'Sales a year (₹ Cr)')}</div>
      <div className="row">{num('margin', 'Profit margin (%)', '0.1', '-30')}{num('growth', 'Sales growth a year (%)', '1', '-20')}</div>
      <div className="row">{num('cash', 'Cash in bank (₹ Cr)')}{num('debt', 'Bank loans (₹ Cr)')}</div>
      <div className="row">{num('staff', 'Staff', '1')}<div className="field"><label htmlFor="nb_raw">Main raw material</label><input id="nb_raw" className="input" maxLength={40} placeholder="For example green tea leaf" value={f.raw} onChange={upd('raw')} /></div></div>
      <div className="field"><label htmlFor="nb_mkt">Market price that affects it most</label>
        <select id="nb_mkt" className="input" value={f.market} onChange={upd('market')}>{Object.entries(MARKET).map(([k, m]) => <option key={k} value={k}>{m.n}</option>)}</select></div>
      <div className="field"><span className="lab">Colour for its workspace</span>
        <div className="row" style={{ gap: 8 }}>{pal.map((p, i) => <button type="button" key={p} className={`swatch${f.color === p ? ' on' : ''}`} style={{ background: p }} aria-label={`Colour ${i + 1}`} aria-pressed={f.color === p} onClick={() => setF({ ...f, color: p })} />)}</div></div>
      {err && <p className="note" style={{ color: 'var(--loss)' }} role="alert">{err}</p>}
      <div className="row"><button className="btn" onClick={save}><Icon name="plus" /> Add business</button><button className="btn ghost" onClick={closeDrawer}>Cancel</button></div>
    </>
  );
}
