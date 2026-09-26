// Tanishtiruv: 3 slayd, bir marta ko'rsatiladi
import { useState } from 'react';
import { useStore } from '../lib/store';
import { haptic } from '../lib/telegram';

const ART = ['logo', '🛍', '📦'];

export default function Onboarding({ onDone }) {
  const { t, lang, setLang } = useStore();
  const [i, setI] = useState(0);
  const slide = t.onb[i];
  const last = i === t.onb.length - 1;

  return (
    <div className="onb">
      <div className="onb-top">
        <div className="seg seg-sm">
          <button className={lang === 'uz' ? 'on' : ''} onClick={() => setLang('uz')}>
            UZ
          </button>
          <button className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>
            RU
          </button>
        </div>
        {!last && (
          <button className="link" onClick={onDone}>
            {t.skip}
          </button>
        )}
      </div>

      <div className="onb-art">
        {ART[i] === 'logo' ? (
          <img src="/logo.png" onError={(e) => (e.currentTarget.src = '/logo.svg')} alt="Bravo" />
        ) : (
          <span>{ART[i]}</span>
        )}
      </div>
      <h1>{slide.t}</h1>
      <p>{slide.d}</p>

      <div className="onb-dots">
        {t.onb.map((_, k) => (
          <span key={k} className={k === i ? 'on' : ''} />
        ))}
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={() => {
          haptic.tap();
          last ? onDone() : setI(i + 1);
        }}
      >
        {last ? t.start : t.next}
      </button>
    </div>
  );
}
