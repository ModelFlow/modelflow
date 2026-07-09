import { useEffect, useState } from 'react';
import { App } from './App';
import { Landing } from './Landing';
import { Library } from './LibraryPage';

type View = 'home' | 'demo' | 'library';
const viewFromHash = (): View => (location.hash === '#demo' ? 'demo' : location.hash === '#library' ? 'library' : 'home');

/** Top-level shell: the explainer landing, the live Studio demo, and the Model Library. */
export function Site() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<View>(viewFromHash);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (v: View) => {
    location.hash = v === 'demo' ? '#demo' : v === 'library' ? '#library' : '';
    setView(v);
    window.scrollTo(0, 0);
  };

  if (view === 'demo') return <App theme={theme} setTheme={setTheme} onBack={() => go('home')} />;
  if (view === 'library') return <Library theme={theme} setTheme={setTheme} onBack={() => go('home')} onDemo={() => go('demo')} />;
  return <Landing theme={theme} setTheme={setTheme} onLaunch={() => go('demo')} onLibrary={() => go('library')} />;
}
