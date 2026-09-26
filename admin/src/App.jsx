// Admin panel: menyu va sahifalar
import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './lib/api';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Stories from './pages/Stories';
import Users from './pages/Users';
import Broadcast from './pages/Broadcast';
import Settings from './pages/Settings';

const PAGES = [
  { key: 'orders', label: 'Buyurtmalar', icon: '🧾', C: Orders },
  { key: 'products', label: 'Mahsulotlar', icon: '👕', C: Products },
  { key: 'stock', label: 'Ombor', icon: '📦', C: Stock },
  { key: 'stories', label: 'Storylar', icon: '⭕', C: Stories },
  { key: 'users', label: 'Mijozlar', icon: '👥', C: Users },
  { key: 'broadcast', label: 'Rassilka', icon: '📣', C: Broadcast },
  { key: 'settings', label: 'Sozlamalar', icon: '⚙️', C: Settings },
];

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(() => (location.hash || '#orders').slice(1));

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthed(false));
  }, []);
  useEffect(() => {
    if (authed) api.get('/meta').then(setMeta).catch(() => {});
  }, [authed]);
  useEffect(() => {
    location.hash = page;
  }, [page]);
  // Brauzer manzilidagi #bo'lim o'zgarsa — sahifani ham almashtiramiz
  useEffect(() => {
    const onHash = () => setPage((location.hash || '#orders').slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const onLogin = useCallback(() => setAuthed(true), []);

  if (!authed) return <Login onLogin={onLogin} />;
  if (!meta) return <div className="loading">Yuklanmoqda…</div>;

  const current = PAGES.find((p) => p.key === page) || PAGES[0];
  const Page = current.C;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src={import.meta.env.BASE_URL + 'logo.svg'} alt="" />
          <div>
            <b>Bravo</b>
            <div className="small">Admin panel</div>
          </div>
        </div>
        <nav>
          {PAGES.map((p) => (
            <button key={p.key} className={p.key === current.key ? 'on' : ''} onClick={() => setPage(p.key)}>
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </nav>
        <button
          className="logout"
          onClick={() => {
            setToken(null);
            setAuthed(false);
          }}
        >
          Chiqish
        </button>
      </aside>
      <main className="main">
        <Page meta={meta} />
      </main>
    </div>
  );
}
