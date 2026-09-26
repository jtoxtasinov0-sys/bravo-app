// Mahsulot oynasi (pastdan chiqadi): rasmlar, rang, razmerlar
import { useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { pick } from '../lib/i18n';
import { money } from '../lib/format';
import { imagesForColor, isLight } from '../lib/colors';
import { sizeLeft, isAvailable } from '../lib/stock';
import { haptic } from '../lib/telegram';
import { useBack } from '../lib/back';
import Img from './Img';
import PriceTag from './PriceTag';
import PhotoViewer from './PhotoViewer';

function Stepper({ value, onChange, min = 0, max = Infinity }) {
  return (
    <div className="stepper">
      <button
        disabled={value <= min}
        onClick={() => {
          haptic.select();
          onChange(Math.max(min, value - 1));
        }}
      >
        −
      </button>
      <span>{value}</span>
      <button
        disabled={value >= max}
        onClick={() => {
          haptic.select();
          onChange(Math.min(max, value + 1));
        }}
      >
        +
      </button>
    </div>
  );
}

export default function ProductSheet({ product: p, onClose, onAdded }) {
  const { lang, t, config, addToCart } = useStore();
  const [color, setColor] = useState(p.colors?.[0]?.name || null);
  const [slide, setSlide] = useState(0);
  const [viewer, setViewer] = useState(null);
  const [sizeQty, setSizeQty] = useState({});
  const trackRef = useRef(null);
  useBack(onClose, !viewer);

  const idx = useMemo(() => imagesForColor(p, color), [p, color]);
  const unit = config?.units?.[p.unit]?.[lang] || p.unit;
  const sizes = p.sizes?.length ? p.sizes : ['—'];
  const available = isAvailable(p);

  const qty = Object.values(sizeQty).reduce((a, b) => a + b, 0);
  const total = qty * p.price;

  const add = () => {
    if (!qty || !available) return;
    addToCart({ productId: p.id, color, sizeQty });
    haptic.success();
    onAdded?.();
    onClose();
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose}>
          ✕
        </button>

        <div className="gallery">
          <div className="gallery-track" ref={trackRef} onScroll={onScroll}>
            {idx.map((i, k) => (
              <Img
                key={p.images[i] + k}
                src={p.images[i]}
                frame={p.imageFrames?.[i]}
                className="gallery-slide"
                onClick={() => setViewer(k)}
              />
            ))}
          </div>
          {idx.length > 1 && (
            <div className="gallery-dots">
              {idx.map((_, k) => (
                <span key={k} className={k === slide ? 'on' : ''} />
              ))}
            </div>
          )}
        </div>

        <div className="sheet-body">
          <div className="sheet-article">
            {t.article}: {p.article}
          </div>
          <h2 className="sheet-title">{pick(p, 'name', lang)}</h2>
          <PriceTag product={p} size="lg" />
          <div className="muted small">{t.perUnit}</div>

          {p.colors?.length > 0 && (
            <div className="block">
              <div className="label">
                {t.color}: <b>{color}</b>
              </div>
              <div className="chips">
                {p.colors.map((c) => (
                  <button
                    key={c.name}
                    className={'color-chip' + (c.name === color ? ' on' : '')}
                    onClick={() => {
                      haptic.select();
                      setColor(c.name);
                      setSlide(0);
                      trackRef.current?.scrollTo({ left: 0 });
                    }}
                  >
                    <span className={'dot' + (isLight(c.hex) ? ' dot-light' : '')} style={{ background: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!available ? (
            <div className="soldout-box">{t.soldOut}</div>
          ) : (
            <div className="block">
              <div className="label">{t.sizes}</div>
              <div className="size-list">
                {sizes.map((s) => {
                  const left = sizeLeft(p, s);
                  const q = sizeQty[s] || 0;
                  return (
                    <div key={s} className={'size-row' + (left <= 0 ? ' off' : '')}>
                      <div>
                        <b>{s}</b>
                        {left !== Infinity && (
                          <span className="muted small">
                            {' '}
                            · {left > 0 ? `${t.left}: ${left}` : t.soldOut}
                          </span>
                        )}
                      </div>
                      <Stepper value={q} max={left} onChange={(v) => setSizeQty((x) => ({ ...x, [s]: v }))} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(p.description || p.material) && (
            <div className="block">
              {p.material && (
                <div className="small">
                  <b>{t.material}:</b> {pick(p, 'material', lang)}
                </div>
              )}
              {p.description && <p className="desc">{pick(p, 'description', lang)}</p>}
            </div>
          )}
        </div>

        <div className="sheet-footer">
          <div>
            <div className="muted small">
              {t.total}: {qty} {unit}
            </div>
            <div className="sheet-total">{money(total, lang)}</div>
          </div>
          <button className="btn btn-primary" disabled={!qty || !available} onClick={add}>
            {t.addToCart}
          </button>
        </div>
      </div>

      {viewer !== null && (
        <PhotoViewer images={idx.map((i) => p.images[i])} start={viewer} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
