// Buyurtma rasmiylashtirish: ism, telefon, viloyat, manzil, izoh, to'lov usuli
import { useState } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import { money, formatPhone } from '../lib/format';
import { haptic, tgUser } from '../lib/telegram';
import { useBack } from '../lib/back';
import { useCartCalc } from './Cart';

const FORM_KEY = 'bravo_checkout';

export default function Checkout({ onBack, onPlaced }) {
  const { t, lang, config, user, cart, clearCart } = useStore();
  const { calc } = useCartCalc();
  useBack(onBack);

  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(FORM_KEY) || '{}');
    } catch {
      return {};
    }
  })();
  const [f, setF] = useState({
    name: saved.name || [tgUser()?.first_name, tgUser()?.last_name].filter(Boolean).join(' ') || user?.firstName || '',
    phone: saved.phone || user?.phone || '+998 ',
    region: saved.region || '',
    address: saved.address || '',
    comment: '',
  });
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: k === 'phone' ? formatPhone(e.target.value) : e.target.value }));

  const methods = [
    { key: 'cash', label: t.cash, icon: '💵' },
    config?.payments?.click && { key: 'click', label: t.click, icon: '📲' },
    config?.payments?.card && { key: 'card', label: t.card, icon: '💳' },
  ].filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 12 || !f.region || !f.address.trim()) {
      haptic.error();
      setErr(lang === 'ru' ? 'Заполните все поля' : "Barcha maydonlarni to'ldiring");
      return;
    }
    setBusy(true);
    try {
      const { comment, ...keep } = f;
      try {
        localStorage.setItem(FORM_KEY, JSON.stringify(keep));
      } catch {
        /* */
      }
      const res = await api.post('/orders', { items: cart, customer: f, paymentMethod: method });
      haptic.success();
      clearCart();
      onPlaced(res);
    } catch (e2) {
      haptic.error();
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="page page-overlay page-with-footer" onSubmit={submit}>
      <h1 className="page-title">{t.checkout}</h1>

      <div className="form-card">
        <div className="label">{t.yourData}</div>
        <label className="field">
          <span>{t.name}</span>
          <input value={f.name} onChange={set('name')} autoComplete="name" />
        </label>
        <label className="field">
          <span>{t.phone}</span>
          <input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />
        </label>
        <label className="field">
          <span>{t.region}</span>
          <select value={f.region} onChange={set('region')}>
            <option value="">{t.chooseRegion}</option>
            {config?.regions.map((r) => (
              <option key={r.uz} value={r.uz}>
                {r[lang] || r.uz}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.address}</span>
          <input value={f.address} onChange={set('address')} />
        </label>
        <label className="field">
          <span>{t.comment}</span>
          <textarea rows={2} value={f.comment} onChange={set('comment')} />
        </label>
      </div>

      <div className="form-card">
        <div className="label">{t.payment}</div>
        {methods.map((m) => (
          <label key={m.key} className={'radio' + (method === m.key ? ' on' : '')}>
            <input type="radio" name="pm" checked={method === m.key} onChange={() => setMethod(m.key)} />
            <span className="radio-icon">{m.icon}</span>
            {m.label}
          </label>
        ))}
      </div>

      {err && <div className="notice notice-err">{err}</div>}

      <div className="footer-bar">
        <div>
          <div className="muted small">
            {t.total}: {calc?.totalQty || 0} {t.items}
          </div>
          <div className="sheet-total">{money(calc?.total, lang)}</div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !calc?.lines.length}>
          {busy ? t.sending : t.confirmOrder}
        </button>
      </div>
    </form>
  );
}
