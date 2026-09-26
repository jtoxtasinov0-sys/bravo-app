// Pastki menyu: Bosh sahifa, Katalog, Savatcha (soni bilan), Profil
import { useStore } from '../lib/store';
import { haptic } from '../lib/telegram';

const ICONS = {
  home: (
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  ),
  catalog: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  cart: (
    <>
      <path d="M5 7h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </>
  ),
};

export default function BottomNav({ tab, onTab }) {
  const { t, cartCount } = useStore();
  return (
    <nav className="bottom-nav">
      {['home', 'catalog', 'cart', 'profile'].map((k) => (
        <button
          key={k}
          className={tab === k ? 'on' : ''}
          onClick={() => {
            haptic.select();
            onTab(k);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
            {ICONS[k]}
          </svg>
          {k === 'cart' && cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          <span>{t[k]}</span>
        </button>
      ))}
    </nav>
  );
}
