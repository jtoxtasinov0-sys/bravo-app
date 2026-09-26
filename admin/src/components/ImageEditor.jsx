// Rasmni kartochkada joylash: kattalashtirish (zoom) va surish (x, y).
// Asl rasm o'zgarmaydi — faqat qanday ko'rinishi saqlanadi.
import { useRef, useState } from 'react';
import { imgUrl } from '../lib/api';
import { frameStyle, DEFAULT_FRAME } from '../lib/frame';

export default function ImageEditor({ src, frame, onSave, onClose }) {
  const [f, setF] = useState({ ...DEFAULT_FRAME, ...(frame || {}) });
  const drag = useRef(null);

  const clamp = (v) => Math.min(100, Math.max(0, v));

  // Sichqoncha / barmoq bilan surish
  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    drag.current = { x: p.clientX, y: p.clientY, f };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const p = e.touches ? e.touches[0] : e;
    const box = e.currentTarget.getBoundingClientRect();
    const dx = ((p.clientX - drag.current.x) / box.width) * 100;
    const dy = ((p.clientY - drag.current.y) / box.height) * 100;
    setF({ ...drag.current.f, x: clamp(drag.current.f.x - dx), y: clamp(drag.current.f.y - dy) });
  };
  const onUp = () => (drag.current = null);

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>Rasmni joylash</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted small">Rasmni sichqoncha yoki barmoq bilan suring. Mini App kartochkasida aynan shunday ko'rinadi.</p>
        <div
          className="editor-box"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          <img src={imgUrl(src)} alt="" style={frameStyle(f)} draggable={false} />
        </div>
        <label className="field">
          <span>Kattalashtirish: {f.zoom.toFixed(2)}×</span>
          <input type="range" min="1" max="3" step="0.05" value={f.zoom} onChange={(e) => setF({ ...f, zoom: Number(e.target.value) })} />
        </label>
        <div className="row gap8">
          <label className="field grow">
            <span>Gorizontal: {Math.round(f.x)}%</span>
            <input type="range" min="0" max="100" value={f.x} onChange={(e) => setF({ ...f, x: Number(e.target.value) })} />
          </label>
          <label className="field grow">
            <span>Vertikal: {Math.round(f.y)}%</span>
            <input type="range" min="0" max="100" value={f.y} onChange={(e) => setF({ ...f, y: Number(e.target.value) })} />
          </label>
        </div>
        <div className="row between">
          <button className="btn btn-light" onClick={() => setF({ ...DEFAULT_FRAME })}>
            Asl holat
          </button>
          <button className="btn btn-primary" onClick={() => onSave(f)}>
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
