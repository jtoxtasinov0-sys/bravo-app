// Kirganda: "Ulgurji (optom)" yoki "Donaga" tanlash
import { useStore } from '../lib/store';
import { haptic } from '../lib/telegram';

export default function ModeSelect() {
  const { t, setMode } = useStore();
  const choose = (m) => {
    haptic.tap();
    setMode(m);
  };
  return (
    <div className="mode-select">
      <img className="mode-logo" src="/logo.png" onError={(e) => (e.currentTarget.src = '/logo.svg')} alt="Bravo" />
      <h1>{t.chooseMode}</h1>
      <button className="mode-card" onClick={() => choose('wholesale')}>
        <span className="mode-icon">📦</span>
        <div>
          <b>{t.wholesale}</b>
          <p>{t.wholesaleDesc}</p>
        </div>
      </button>
      <button className="mode-card" onClick={() => choose('retail')}>
        <span className="mode-icon">👕</span>
        <div>
          <b>{t.retail}</b>
          <p>{t.retailDesc}</p>
        </div>
      </button>
    </div>
  );
}
