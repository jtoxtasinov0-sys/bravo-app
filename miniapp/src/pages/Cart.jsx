// Savatcha: optom va dona bo'limlari alohida. Narxlar serverda qayta hisoblanadi
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { haptic } from '../lib/telegram';
import Img from '../components/Img';

function Mini({ value, onChange, min = 0 }) {
  return (
    <div className="stepper stepper-sm">
      <button onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span>{value}</span>
      <button onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

export function useCartCalc() {
  const { cart, lang } = useStore();
  const [calc, setCalc] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!cart.length) {
      setCalc({ lines: [], total: 0, totalQty: 0, errors: [] });
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .post('/cart/calculate', { items: cart })
        .then(setCalc)
        .catch((e) => setCalc({ lines: [], total: 0, totalQty: 0, errors: [e.message] }))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [cart, lang]);
  return { calc, loading };
}

export default function Cart({ onCheckout, onCatalog }) {
  const { t, lang, config, cart, updateCartItem, removeFromCart, clearCart } = useStore();
  const { calc, loading } = useCartCalc();

  if (!cart.length) {
    return (
      <div className="page">
        <h1 className="page-title">{t.cart}</h1>
        <div className="empty-big">
          <div className="empty-icon">🛍</div>
          <b>{t.cartEmpty}</b>
          <p className="muted">{t.cartEmptyHint}</p>
          <button className="btn btn-primary" onClick={onCatalog}>
            {t.goCatalog}
          </button>
        </div>
      </div>
    );
  }

  const lineFor = (key) => calc?.lines.find((l) => l.key === key);
  const unitName = (u) => config?.units?.[u]?.[lang] || u;

  const section = (mode, title) => {
    const items = cart.filter((c) => c.mode === mode);
    if (!items.length) return null;
    const sum = items.reduce((a, c) => a + (lineFor(c.key)?.lineTotal || 0), 0);
    return (
      <section className="cart-section">
        <div className="section-head">
          <h2>{title}</h2>
          <span className="muted small">{money(sum, lang)}</span>
        </div>
        {items.map((c) => {
          const l = lineFor(c.key);
          return (
            <div key={c.key} className={'cart-item' + (l ? '' : ' off')}>
              <Img src={l?.image} className="cart-img" />
              <div className="cart-info">
                <div className="cart-name">{l?.name || '…'}</div>
                <div className="muted small">
                  {l?.color && (
                    <>
                      <span className="dot dot-xs" style={{ background: l.colorHex }} /> {l.color} ·{' '}
                    </>
                  )}
                  {l ? `${money(l.unitPrice, lang)} × ${l.qty} ${unitName(l.unit)}` : ''}
                </div>

                {mode === 'wholesale' ? (
                  <div className="row between mt8">
                    <span className="small">{t.packs}</span>
                    <Mini value={c.packs || 0} min={1} onChange={(v) => updateCartItem(c.key, { packs: v })} />
                  </div>
                ) : (
                  <div className="cart-sizes">
                    {Object.entries(c.sizeQty || {})
                      .filter(([, q]) => q > 0)
                      .map(([s, q]) => (
                        <div key={s} className="row between">
                          <span className="small">
                            {t.size} <b>{s}</b>
                          </span>
                          <Mini
                            value={q}
                            onChange={(v) => {
                              const next = { ...c.sizeQty, [s]: v };
                              if (!Object.values(next).some((x) => x > 0)) removeFromCart(c.key);
                              else updateCartItem(c.key, { sizeQty: next });
                            }}
                          />
                        </div>
                      ))}
                  </div>
                )}
                <div className="row between mt8">
                  <b>{l ? money(l.lineTotal, lang) : ''}</b>
                  <button
                    className="link link-red small"
                    onClick={() => {
                      haptic.tap();
                      removeFromCart(c.key);
                    }}
                  >
                    {t.remove}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <div className="page page-with-footer">
      <div className="row between">
        <h1 className="page-title">{t.cart}</h1>
        <button className="link link-red" onClick={clearCart}>
          {t.clear}
        </button>
      </div>

      {section('wholesale', t.wholesaleSection)}
      {section('retail', t.retailSection)}

      {calc?.errors?.length > 0 && (
        <div className="notice notice-err">
          {calc.errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      <div className="footer-bar">
        <div>
          <div className="muted small">
            {t.total}: {calc?.totalQty || 0} {t.items}
          </div>
          <div className="sheet-total">{loading && !calc ? '…' : money(calc?.total, lang)}</div>
        </div>
        <button
          className="btn btn-primary"
          disabled={!calc?.lines.length || calc?.errors?.length > 0 || loading}
          onClick={onCheckout}
        >
          {t.checkout}
        </button>
      </div>
    </div>
  );
}
