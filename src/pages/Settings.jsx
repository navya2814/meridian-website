import { useApp } from '../AppContext.jsx';
import { Callout, Card, Empty, Kv, PageHead, Seg, SliderRow, Tabs, useTab } from '../components/ui.jsx';
import { CO, COMPANIES, DOCS, FUND_META } from '../lib/data.js';
import { CR, inr } from '../lib/format.js';
import { OVERRIDES, RULES, resetRules } from '../lib/engine.js';

function NumField({ id, label, value, onChange, step = '1', min = '0', max }) {
  return (
    <div className="field"><label htmlFor={id}>{label}</label>
      <input id={id} className="input num" type="number" step={step} min={min} max={max} defaultValue={value} key={value}
        onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
    </div>
  );
}

function NameField({ value, onSave }) {
  return (
    <div className="field"><label htmlFor="pf_name">Your name</label>
      <input id="pf_name" className="input" maxLength={40} defaultValue={value} key={value} placeholder="For example Asha Rao"
        onBlur={e => { const v = e.target.value.trim(); if (v !== value) onSave(v); }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
    </div>
  );
}

function RulesTab() {
  const { bump, toast } = useApp();
  const set = fn => v => { fn(v); bump(); toast('Rules updated. True net profit recalculated.'); };
  return (
    <>
      <Card title="Reserve and provision rules" hint="Changes apply at once to every fund, true net profit, the ranking and the advice. Press Enter or leave a box to apply it."
        bodyStyle={{ display: 'grid', gap: 18 }} actions={<button className="btn ghost sm" onClick={() => { resetRules(); bump(); toast('Rules reset to defaults'); }}>Reset to defaults</button>}>
        <div className="grid g3">
          <NumField id="r_grat" label="Gratuity days per year of service" value={RULES.gratDays} max="30" onChange={set(v => { RULES.gratDays = Math.max(0, Math.min(30, v)); })} />
          <NumField id="r_catch" label="Years to close a shortfall" value={RULES.catchUp} min="1" max="6" onChange={set(v => { RULES.catchUp = Math.max(1, Math.min(6, Math.round(v))); })} />
          <NumField id="r_bonus" label="Bonus rate (%)" step="0.01" max="20" value={+(RULES.bonusRate * 100).toFixed(2)} onChange={set(v => { RULES.bonusRate = Math.max(0, Math.min(20, v)) / 100; })} />
        </div>
        <div className="field"><span className="lab">Emergency reserve: months of running costs</span>
          <SliderRow value={RULES.emerMonths} min={1} max={12} step={1} label="Emergency months" onChange={v => { RULES.emerMonths = Math.max(1, Math.min(12, Math.round(v))); bump(); }} /></div>
        <div><div className="lab small t-muted" style={{ fontWeight: 500, marginBottom: 6 }}>Bad debt provision by age of unpaid invoice (%)</div>
          <div className="grid g4">{['0 to 30 days', '31 to 90 days', '91 to 180 days', 'Over 180 days'].map((l, i) => (
            <NumField key={l} id={`r_bad${i}`} label={l} max="100" value={+(RULES.bad[i] * 100).toFixed(0)} onChange={set(v => { RULES.bad[i] = Math.max(0, Math.min(100, v)) / 100; })} />))}</div></div>
        <div><div className="lab small t-muted" style={{ fontWeight: 500, marginBottom: 6 }}>Stock loss provision (% of stock value)</div>
          <div className="grid g4">{COMPANIES.map(c => (
            <NumField key={c.id} id={`r_sl_${c.id}`} label={c.short} step="0.1" max="30" value={+((RULES.stockLoss[c.id] ?? 0.03) * 100).toFixed(1)} onChange={set(v => { RULES.stockLoss[c.id] = Math.max(0, Math.min(30, v)) / 100; })} />))}</div></div>
        <Callout>These defaults are estimates. The final treatment should follow the accounting standards, tax rules and labour laws that apply to each company, and be confirmed by a qualified accountant.</Callout>
      </Card>
      <Card title="Accountant overrides" hint="Set from the Reserves table. Each one keeps a note explaining why.">
        {Object.keys(OVERRIDES).length ? (
          <div className="list">{Object.entries(OVERRIDES).map(([k, o]) => { const [c, f] = k.split('.'); return (
            <div className="list-row" key={k}><span className="sev info" /><div><div className="t">{CO[c] ? CO[c].short : c}: {FUND_META[f].n}, {inr(o.amt * CR)}</div><div className="d">{o.note} · {o.by}</div></div></div>); })}</div>
        ) : <Empty>No overrides yet.</Empty>}
      </Card>
    </>
  );
}

export default function Settings() {
  const { theme, setTheme, collapsed, setCollapsed, profile, setProfile, toast } = useApp();
  const [tab, setTab] = useTab('rules', ['rules', 'appearance', 'data', 'users', 'security']);
  return (
    <>
      <PageHead title="Settings" sub="Rules for reserves, appearance, data, users and security." />
      <Tabs value={tab} onChange={setTab} list={[['rules', 'Reserve rules'], ['appearance', 'Appearance'], ['data', 'Data and sync'], ['users', 'Profile'], ['security', 'Security']]} />
      {tab === 'rules' && <RulesTab />}
      {tab === 'appearance' && (
        <Card title="Appearance" bodyStyle={{ display: 'grid', gap: 16 }}>
          <div className="field"><span className="lab">Theme</span><Seg label="Theme" value={theme} onChange={setTheme} options={[[null, 'Match device'], ['light', 'Light'], ['dark', 'Dark']]} /></div>
          <div className="field"><span className="lab">Sidebar</span><Seg label="Sidebar" value={collapsed} onChange={setCollapsed} options={[[false, 'Full'], [true, 'Icons only']]} /></div>
          <p className="note">Number format: Indian system with lakhs and crores. Currency: Indian rupees.</p>
        </Card>
      )}
      {tab === 'data' && (
        <Card title="Data and sync" bodyStyle={{ display: 'grid', gap: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>Where your data is kept</b><p className="note">{DOCS.length} file{DOCS.length === 1 ? '' : 's'} and {COMPANIES.length} business{COMPANIES.length === 1 ? '' : 'es'} are saved in this browser. Nothing is sent to a server.</p></div>
            <span className="pill-sync"><span className="dot" />Saved locally</span>
          </div>
          <div className="divider" />
          <p className="note">Data older than 45 days is flagged on every page that uses it. No market price feed is connected. Settings, saved scenarios and businesses you add are kept in this browser only, so they do not appear on other devices.</p>
        </Card>
      )}
      {tab === 'users' && (
        <Card title="Your profile" hint="Used for the greeting. Shared access for several people needs a server and sign-in, which this version does not have." bodyStyle={{ display: 'grid', gap: 12 }}>
          <NameField value={profile.name} onSave={name => { setProfile({ ...profile, name }); toast('Profile saved'); }} />
        </Card>
      )}
      {tab === 'security' && (
        <Card title="Security" bodyStyle={{ display: 'grid', gap: 12 }}>
          <Callout tone="info">This version runs in your browser and sends nothing to a server. Anything you enter is stored in this browser's local storage, unencrypted, and anyone using this browser profile can see it. Before relying on it for real books, a production build needs secure sign-in, encryption of stored files, and access rules for each user.</Callout>
          <Kv items={[['Workspace', 'This browser only'], ['Files added on Data Import', 'Read in this browser only'], ['API keys or passwords in the code', 'None']]} />
        </Card>
      )}
    </>
  );
}
