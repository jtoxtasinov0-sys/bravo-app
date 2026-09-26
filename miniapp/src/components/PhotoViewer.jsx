// To'liq ekranda rasm ko'rish (chapga/o'ngga surish)
import { useRef, useState } from 'react';
import { imgUrl } from '../lib/image';
import { useBack } from '../lib/back';

export default function PhotoViewer({ images, start = 0, onClose }) {
  const [i, setI] = useState(start);
  const touch = useRef(null);
  useBack(onClose);

  const go = (d) => setI((x) => (x + d + images.length) % images.length);

  return (
    <div
      className="viewer"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <img src={imgUrl(images[i])} alt="" onClick={(e) => e.stopPropagation()} />
      <button className="viewer-close" onClick={onClose}>
        ✕
      </button>
      {images.length > 1 && (
        <div className="viewer-dots">
          {images.map((_, k) => (
            <span key={k} className={k === i ? 'on' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}
