import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { store } from './lib/storage.js';
import { blankScenario, fixScenario } from './lib/engine.js';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  // `version` is bumped whenever the shared finance data changes (rules, overrides, businesses, imports),
  // so every page recalculates from the engine.
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion(v => v + 1), []);

  const [theme, setThemeState] = useState(() => store.get('theme', null));
  const [sysDark, setSysDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [collapsed, setCollapsedState] = useState(() => !!store.get('collapsed', false));
  const [navOpen, setNavOpen] = useState(false);
  const [coTheme, setCoTheme] = useState(null);

  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  const [profile, setProfileState] = useState(() => { const p = store.get('profile', null); return p && typeof p.name === 'string' ? p : { name: '' }; });

  const [sc, setSc] = useState(blankScenario);
  const [saved, setSavedState] = useState(() => {
    const list = store.get('saved', []);
    return Array.isArray(list) ? list.filter(x => x && x.name && x.sc).map(x => ({ ...x, sc: fixScenario(x.sc) })) : [];
  });
  const [chosen, setChosenState] = useState(() => store.get('chosen', null));

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = e => setSysDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // A business may have been added or removed, so point the What If scenario only at businesses that exist.
  useEffect(() => { setSc(p => fixScenario(p)); }, [version]);

  const setProfile = useCallback(p => { setProfileState(p); store.set('profile', p); }, []);
  const setTheme = useCallback(t => { setThemeState(t); store.set('theme', t); }, []);
  const setCollapsed = useCallback(v => { setCollapsedState(v); store.set('collapsed', v); }, []);
  const setSaved = useCallback(list => { setSavedState(list); store.set('saved', list); }, []);
  const setChosen = useCallback(n => { setChosenState(n); store.set('chosen', n); }, []);

  const toast = useCallback(msg => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  }, []);
  const openDrawer = useCallback((title, sub, body) => setDrawer({ title, sub, body }), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const openModal = useCallback((title, body) => setModal({ title, body }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const showTrace = useCallback(t => setDrawer({ trace: t }), []);

  const dark = theme ? theme === 'dark' : sysDark;
  // Charts read colours from CSS variables, so they redraw when the theme or company colours change.
  const chartKey = `${dark}-${coTheme || 'family'}-${version}`;

  const value = useMemo(() => ({
    version, bump, theme, setTheme, dark, collapsed, setCollapsed, navOpen, setNavOpen, coTheme, setCoTheme, chartKey,
    drawer, openDrawer, closeDrawer, modal, openModal, closeModal, toastMsg, toast, showTrace,
    profile, setProfile, sc, setSc, saved, setSaved, chosen, setChosen,
  }), [version, bump, theme, setTheme, dark, collapsed, setCollapsed, navOpen, coTheme, chartKey, drawer, openDrawer, closeDrawer,
    modal, openModal, closeModal, toastMsg, toast, showTrace, profile, setProfile, sc, saved, setSaved, chosen, setChosen]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
