import { useEffect, useState } from 'react';
import { App } from './App';
import { Landing } from './Landing';

/** Top-level shell: the explainer landing page, and the live Studio demo. */
export function Site() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<'home' | 'demo'>(() => (location.hash === '#demo' ? 'demo' : 'home'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onHash = () => setView(location.hash === '#demo' ? 'demo' : 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (v: 'home' | 'demo') => {
    location.hash = v === 'demo' ? '#demo' : '';
    setView(v);
    window.scrollTo(0, 0);
  };

  return view === 'demo' ? (
    <App theme={theme} setTheme={setTheme} onBack={() => go('home')} />
  ) : (
    <Landing theme={theme} setTheme={setTheme} onLaunch={() => go('demo')} />
  );
}
