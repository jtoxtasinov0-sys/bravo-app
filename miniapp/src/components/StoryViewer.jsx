// Story'ni to'liq ekranda ko'rsatish (5 soniyada keyingisiga o'tadi)
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { pick } from '../lib/i18n';
import { imgUrl } from '../lib/image';
import { useBack } from '../lib/back';

const DURATION = 5000;

export default function StoryViewer({ stories, start, onClose, onSeen, onOpenProduct }) {
  const { lang, t } = useStore();
  const [i, setI] = useState(start);
  const s = stories[i];
  useBack(onClose);

  useEffect(() => {
    onSeen(s.id);
    const timer = setTimeout(() => {
      if (i < stories.length - 1) setI(i + 1);
      else onClose();
    }, DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  return (
    <div className="story-viewer">
      <div className="story-bars">
        {stories.map((_, k) => (
          <span key={k}>
            <i className={k < i ? 'full' : k === i ? 'run' : ''} style={{ animationDuration: DURATION + 'ms' }} />
          </span>
        ))}
      </div>
      <img src={imgUrl(s.image)} alt="" />
      <button className="viewer-close" onClick={onClose}>
        ✕
      </button>
      <div className="story-tap left" onClick={() => setI(Math.max(0, i - 1))} />
      <div className="story-tap right" onClick={() => (i < stories.length - 1 ? setI(i + 1) : onClose())} />
      <div className="story-caption">
        <h3>{pick(s, 'title', lang)}</h3>
        {s.productId && (
          <button className="btn btn-light" onClick={() => onOpenProduct(s.productId)}>
            {t.catalog} →
          </button>
        )}
      </div>
    </div>
  );
}
