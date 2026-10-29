// Small reusable building blocks shared by every page.
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { Icon } from './Icon.jsx';
import { inr, inrFull, fmtDate } from '../lib/format.js';

export function Delta({ x, kind = 'money', invert = false, d = 1, style }) {
  if (x == null || isNaN(x) || !isFinite(x)) return null;
  const good = invert ? x < 0 : x > 0;
  const cls = Math.abs(x) < 1e-9 ? 'flat' : good ? 'up' : 'down';
  const arrow = x > 0 ? '↑' : x < 0 ? '↓' : '';
  const txt = kind === 'money' ? inr(Math.abs(x)) : kind === 'pp' ? Math.abs(x * 100).toFixed(d) + ' pts' : kind === 'mo' ? Math.abs(x).toFixed(1) + ' mo' : Math.abs(x * 100).toFixed(d) + '%';
  return <span className={`delta ${cls}`} style={style}>{arrow} {x > 0 ? '+' : x < 0 ? '−' : ''}{txt}</span>;
}

export const Tag = ({ tone, children, style }) => <span className={`tag ${tone}`} style={style}>{children}</span>;
export const CoDot = ({ id, color }) => <span className="co-dot" style={{ background: color || `var(--c-${id})` }} />;

export function Card({ title, hint, actions, children, bodyClass = 'card-b', bodyStyle, className = '', id }) {
  return (
    <section className={`card ${className}`} id={id}>
      {(title || actions) && (
        <div className="card-h">
          <div>{title && <h3>{title}</h3>}{hint && <p className="hint">{hint}</p>}</div>
          {actions}
        </div>
      )}
      <div className={bodyClass} style={bodyStyle}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, foot, lead, onClick, icon, children }) {
  const Tag2 = onClick ? 'button' : 'div';
  return (
    <Tag2 className={`kpi${lead ? ' lead' : ''}`} style={onClick ? undefined : { cursor: 'default' }} onClick={onClick} type={onClick ? 'button' : undefined}>
      <div className="lbl">{label} {icon && <Icon name={icon} />}</div>
      <div className="val num">{value}</div>
      {foot && <div className="foot">{foot}</div>}
      {children}
    </Tag2>
  );
}

export function Callout({ tone = 'info', icon, children, style }) {
  return <div className={`callout ${tone}`} style={style}><Icon name={icon || (tone === 'info' ? 'info' : 'warn')} /><div>{children}</div></div>;
}

/** Tabs whose selection lives in the URL (?tab=...), so every tab can be linked to directly. */
export function useTab(def, valid) {
  const [params, setParams] = useSearchParams();
  let cur = params.get('tab') || def;
  if (valid && !valid.includes(cur)) cur = def;
  const set = t => { const p = new URLSearchParams(params); if (t === def) p.delete('tab'); else p.set('tab', t); setParams(p, { replace: true }); };
  return [cur, set];
}

export function Tabs({ list, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {list.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

export function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, l]) => <button key={String(k)} className={value === k ? 'on' : ''} aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

export function HBar({ rows, max }) {
  const mx = max ?? Math.max(...rows.map(r => r.v), 1e-9);
  return (
    <div className="hbar">
      {rows.map(r => {
        const inner = (
          <>
            <div className="nm">{r.dot && <CoDot id={r.dot} />}<span>{r.n}</span>{r.extra}</div>
            <div className="v">{r.label} {r.sub && <span className="t-muted small">{r.sub}</span>}</div>
            <div className="hbar-track"><i style={{ width: `${Math.max(0, Math.min(100, r.v / mx * 100))}%`, background: r.color || 'var(--accent)' }} /></div>
          </>
        );
        return r.onClick
          ? <button key={r.key || r.n} className="hbar-row" onClick={r.onClick}>{inner}</button>
          : <div key={r.key || r.n} className="hbar-row" style={{ cursor: 'default' }}>{inner}</div>;
      })}
    </div>
  );
}

export function Stats({ items }) {
  return <div className="stats">{items.map(([l, v, cls]) => <div className="stat" key={l}><span className="l">{l}</span><span className={`v ${cls || ''}`}>{v}</span></div>)}</div>;
}

export function Spark({ vals, color, w = 120, h = 30 }) {
  const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * (w - 4) + 2, h - 3 - (v - mn) / r * (h - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${w - 2} ${h} L2 ${h} Z`} fill={color} opacity=".1" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />
    </svg>
  );
}

/** A figure that opens the source rows it was built from. */
export function Trace({ children, label, value, rows, note }) {
  const { showTrace } = useApp();
  return <button type="button" className="trace" onClick={() => showTrace({ label, value, rows, note })}>{children}</button>;
}

export function TraceBody({ t }) {
  const total = t.rows.reduce((s, r) => s + r.amt, 0);
  return (
    <>
      <p className="note">This figure is built from {t.rows.length} row{t.rows.length > 1 ? 's' : ''} in the imported files. The original files are kept untouched; these are the exact rows read.</p>
      {t.note && <div className="note box">{t.note}</div>}
      {t.rows.map((r, i) => (
        <div className="src-row" key={i}>
          <div className="doc"><Icon name="file" />{r.doc}</div>
          <div className="meta">Sheet "{r.sheet}", row {r.row} · imported {fmtDate(r.date)}</div>
          <div className="cells"><span>{r.desc}</span><span>{inrFull(r.amt)}</span></div>
        </div>
      ))}
      {t.rows.length > 1 && <dl className="kv"><dt>Sum of rows</dt><dd>{inrFull(total)}</dd></dl>}
    </>
  );
}

export function Kv({ items }) {
  return <dl className="kv">{items.map(([k, v, cls]) => [<dt key={k + 't'}>{k}</dt>, <dd key={k + 'd'} className={cls}>{v}</dd>])}</dl>;
}

export function PageHead({ title, sub, children, greet }) {
  return (
    <div className={`page-head${greet ? ' greet' : ''}`}>
      <div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
      {children}
    </div>
  );
}

export const SampleBanner = ({ children }) => (
  <div className="sample-banner" role="note"><Icon name="info" /><span>{children || 'Sample data. Every figure on this page is illustrative and does not describe a real company.'}</span></div>
);

export const Empty = ({ children }) => <div className="empty">{children}</div>;

/** Range slider paired with a number box. `scale` converts between the stored value and what is shown. */
export function SliderRow({ value, onChange, min, max, step, scale = 1, unit, label }) {
  const shown = +((value ?? 0) / scale).toFixed(4);
  const set = raw => { const v = parseFloat(raw); if (!isNaN(v)) onChange(v * scale); };
  return (
    <>
      <div className="slider-row">
        <input type="range" min={min} max={max} step={step} value={shown} aria-label={label} onChange={e => set(e.target.value)} />
        <input className="input num" type="number" min={min} max={max} step={step} value={shown} aria-label={`${label} value`} onChange={e => set(e.target.value)} />
      </div>
      {unit && <div className="small t-muted" style={{ marginTop: -6 }}>{unit}</div>}
    </>
  );
}

export function SourceRow({ d, extra }) {
  return (
    <div className="src-row">
      <div className="doc"><Icon name="file" />{d.file}</div>
      <div className="meta">{d.type} · {d.unit} · {d.rows.toLocaleString('en-IN')} rows · imported {fmtDate(d.date)}{extra}</div>
    </div>
  );
}
