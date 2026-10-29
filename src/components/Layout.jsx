import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { Icon } from './Icon.jsx';
import { TraceBody } from './ui.jsx';
import { CO } from '../lib/data.js';
import { greeting, today, shortToday, inrFull } from '../lib/format.js';

export const NAV = [
  { sec: 'Main', items: [['overview', 'Overview', '/'], ['financials', 'Financials', '/financials'], ['businesses', 'Businesses', '/businesses']] },
  { sec: 'Resources', items: [['assets', 'Assets', '/assets'], ['liabilities', 'Liabilities', '/liabilities'], ['cashflow', 'Cash Flow', '/cash-flow'], ['investments', 'Investments', '/investments']] },
  { sec: 'Intelligence', items: [['allocation', 'Resource Allocation', '/resource-allocation'], ['forecast', 'Forecast', '/forecast'], ['insights', 'Insights', '/insights']] },
  { sec: 'Data & Reports', items: [['import', 'Data Import', '/data-import'], ['reports', 'Reports', '/reports'], ['settings', 'Settings', '/settings']] },
];
const TITLE_BY_PATH = Object.fromEntries(NAV.flatMap(s => s.items.map(([, l, p]) => [p, l])));

const Logo = ({ className, intro }) => (
  <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18.5" fill="none" stroke={intro ? '#C9A24B' : 'var(--side-accent)'} strokeWidth="1.3" />
    <path d="M20 3v34" stroke={intro ? '#C9A24B' : 'var(--side-accent)'} strokeWidth="1.2" />
    <path d="M8 26c4-7 8-10 12-10s8 3 12 10" fill="none" stroke="#EDE3D6" strokeWidth="1.5" />
    <circle cx="20" cy="16" r="2.5" fill={intro ? '#C9A24B' : 'var(--side-accent)'} />
  </svg>
);

// The welcome screen plays once per browser session, so links straight to a page open at once.
function introSeen() {
  try { return sessionStorage.getItem('meridian.introSeen') === '1'; } catch { return false; }
}
function markIntroSeen() {
  try { sessionStorage.setItem('meridian.introSeen', '1'); } catch { /* ignore */ }
}

function Intro() {
  const [gone, setGone] = useState(introSeen);
  const [removed, setRemoved] = useState(introSeen);
  useEffect(() => { if (gone) markIntroSeen(); }, [gone]);
  useEffect(() => { const t = setTimeout(() => setGone(true), 4800); return () => clearTimeout(t); }, []);
  useEffect(() => { if (gone) { const t = setTimeout(() => setRemoved(true), 700); return () => clearTimeout(t); } return undefined; }, [gone]);
  if (removed) return null;
  return (
    <div id="intro" className={gone ? 'gone' : ''} role="status" aria-live="polite" onClick={() => setGone(true)}>
      <div className="intro-box">
        <Logo className="intro-mark" intro />
        <div className="intro-hello">{greeting()}, <em>Navya</em></div>
        <div className="intro-date">{today()}</div>
        <div className="intro-load"><span className="ring" />Bringing your accounts together</div>
        <div className="intro-bar"><i /></div>
        <div className="intro-skip">Meridian, in development since 2025 · Click anywhere to skip</div>
      </div>
    </div>
  );
}

function SyncText({ short }) {
  const { sync, syncFail } = useApp();
  if (syncFail) return <><span className="dot amber" /><span className={short ? 'txt' : 'hide-c'}>{short ? 'Sync failed' : 'Data Status: Sync failed, retrying'}</span></>;
  if (sync === 'syncing') return <>{short ? <span className="ring" style={{ width: 12, height: 12 }} /> : <span className="dot" />}<span className={short ? 'txt' : 'hide-c'}>{short ? 'Syncing' : 'Data Status: Syncing'}</span></>;
  return <><span className="dot" /><span className={short ? 'txt' : 'hide-c'}>{short ? 'Synced' : 'Data Status: Synced'}</span></>;
}

function Sidebar() {
  const { collapsed, setCollapsed } = useApp();
  const navigate = useNavigate();
  const onKey = e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = [...document.querySelectorAll('.nav-item')];
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
  };
  return (
    <aside className="side" aria-label="Main navigation">
      <div className="side-head">
        <Logo className="logo" />
        <div className="hide-c"><div className="brand-name">Meridian</div><div className="brand-sub">Financial Intelligence Platform</div><div className="brand-sub">In development since 2025</div></div>
      </div>
      <nav className="side-nav" onKeyDown={onKey}>
        {NAV.map(s => (
          <div className="nav-sec" key={s.sec}>
            <div className="nav-title">{s.sec}</div>
            {s.items.map(([k, l, p]) => (
              <NavLink key={k} to={p} end={p === '/'} aria-label={l} title={collapsed ? l : undefined}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Icon name={k} /><span className="hide-c">{l}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <div className="secure">
          <div className="secure-h"><Icon name="lock" /><span className="hide-c">PRIVATE WORKSPACE</span></div>
          <p className="hide-c">Your financial data is private.</p>
          <div className="sync"><SyncText /></div>
        </div>
        <div className="profile">
          <span className="avatar" aria-hidden="true">NM</span>
          <div className="who hide-c"><div className="nm">Navya Mundara</div><div className="rl">Administrator</div></div>
          <button className="profile-link hide-c" onClick={() => navigate('/settings?tab=users')}>Profile <Icon name="chevR" /></button>
        </div>
        <button className="collapse-btn" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>
          <Icon name={collapsed ? 'expand' : 'collapse'} /><span className="hide-c">Collapse</span>
        </button>
      </div>
    </aside>
  );
}

function TopBar({ coId }) {
  const { dark, setTheme, setNavOpen } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const c = coId && CO[coId];
  return (
    <header className="top">
      <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setNavOpen(true)}><Icon name="menu" /></button>
      <div className="crumb">
        {c ? (
          <>
            <span className="co-mark" style={{ background: c.theme.bright }} />
            <span className="here">{c.name}</span>
            <button className="back-link" onClick={() => navigate('/')}><Icon name="arrowL" /><span className="txt">Back to family overview</span></button>
          </>
        ) : (
          <><span className="fam">Mundara family office</span><span className="sep">/</span><span className="here">{TITLE_BY_PATH[pathname] || 'Meridian'}</span></>
        )}
      </div>
      <div className="top-spacer" />
      <span className="sample-chip" title="All figures in this build are sample data">Sample data</span>
      <span className="top-date">{shortToday()}</span>
      <span className="top-sync"><SyncText short /></span>
      <button className="icon-btn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(dark ? 'light' : 'dark')}>
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
    </header>
  );
}

function Drawer() {
  const { drawer, closeDrawer } = useApp();
  const closeRef = useRef(null);
  useEffect(() => { if (drawer) setTimeout(() => closeRef.current && closeRef.current.focus(), 60); }, [drawer]);
  const t = drawer && drawer.trace;
  const title = t ? t.label : drawer && drawer.title;
  const sub = t ? <span className="num" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>{inrFull(t.value)}</span> : drawer && drawer.sub;
  return (
    <aside className={`drawer${drawer ? ' on' : ''}`} aria-hidden={!drawer} role="dialog" aria-labelledby="drawerTitle">
      {drawer && (
        <>
          <div className="drawer-h">
            <div style={{ minWidth: 0 }}><h3 id="drawerTitle" style={{ fontSize: 15 }}>{title}</h3>{sub && <div className="note" style={{ marginTop: 4 }}>{sub}</div>}</div>
            <button className="icon-btn" ref={closeRef} aria-label="Close" onClick={closeDrawer}><Icon name="close" /></button>
          </div>
          <div className="drawer-b">{t ? <TraceBody t={t} /> : drawer.body}</div>
        </>
      )}
    </aside>
  );
}

function Modal() {
  const { modal, closeModal } = useApp();
  return (
    <div className={`modal${modal ? ' on' : ''}`} role="dialog" aria-labelledby="modalTitle" aria-hidden={!modal}>
      {modal && (
        <div className="modal-card">
          <div className="drawer-h"><h3 id="modalTitle" style={{ fontSize: 15 }}>{modal.title}</h3><button className="icon-btn" aria-label="Close" onClick={closeModal}><Icon name="close" /></button></div>
          <div className="modal-b">{modal.body}</div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const app = useApp();
  const { collapsed, navOpen, setNavOpen, drawer, modal, closeDrawer, closeModal, toastMsg, theme, setCoTheme, version } = app;
  const match = useMatch('/businesses/:id');
  const coId = match && CO[match.params.id] ? match.params.id : null;
  const { pathname, search } = useLocation();

  // Apply light/dark and the company colour theme before child charts read CSS variables.
  useLayoutEffect(() => {
    const r = document.documentElement;
    if (theme) r.setAttribute('data-theme', theme); else r.removeAttribute('data-theme');
    const keys = ['--page-l', '--page-d', '--chrome-l', '--chrome-d', '--brand-l', '--brand-d', '--accent-l', '--accent-d', '--side-accent'];
    if (coId) {
      const t = CO[coId].theme;
      [t.tintL, t.tintD, t.deep, t.deepD, t.main, t.main, t.main, t.mainD, t.bright].forEach((v, i) => r.style.setProperty(keys[i], v));
    } else keys.forEach(k => r.style.removeProperty(k));
    setCoTheme(coId);
  }, [theme, coId, setCoTheme, version]);

  useEffect(() => { setNavOpen(false); closeDrawer(); closeModal(); }, [pathname, setNavOpen, closeDrawer, closeModal]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => {
    const title = coId ? CO[coId].name : TITLE_BY_PATH[pathname];
    document.title = title ? `${title} · Meridian` : 'Meridian · Financial Intelligence Platform';
  }, [pathname, coId, search]);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { closeDrawer(); closeModal(); setNavOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeDrawer, closeModal, setNavOpen]);

  const scrimOn = navOpen || !!drawer || !!modal;
  return (
    <>
      <Intro />
      <div className={`app${collapsed ? ' collapsed' : ''}${navOpen ? ' nav-open' : ''}`}>
        <Sidebar />
        <div className="main">
          <TopBar coId={coId} />
          <main className="content fade-in" key={pathname + (coId || '')}><Outlet /></main>
        </div>
      </div>
      <div className={`scrim${scrimOn ? ' on' : ''}`} onClick={() => { closeDrawer(); closeModal(); setNavOpen(false); }} />
      <Drawer />
      <Modal />
      <div className={`toast${toastMsg ? ' on' : ''}`} role="status" aria-live="polite">{toastMsg}</div>
    </>
  );
}
