// Sozlamalar: to'lov kartasi
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Settings() {
  const [s, setS] = useState(null);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/settings').then(setS).catch((e) => setErr(e.message));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      setS(await api.put('/settings', s));
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  if (!s) return <div className="muted">{err || 'Yuklanmoqda…'}</div>;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.type === 'checkbox' ? String(e.target.checked) : e.target.value });

  return (
    <form onSubmit={save}>
      <div className="page-head">
        <h1>Sozlamalar</h1>
      </div>
      <div className="two-col">
        <div className="card pad">
          <h3>💳 To'lov kartasi</h3>
          <p className="muted small">
            Karta kiritilsa — Mini App'da «Kartaga o'tkazma» usuli paydo bo'ladi. Mijoz pul o'tkazib, chek rasmini yuboradi, siz
            botda «Tasdiqlash» / «Rad etish» ni bosasiz.
          </p>
          <label className="field">
            <span>Karta raqami</span>
            <input value={s.cardNumber || ''} onChange={set('cardNumber')} placeholder="8600 0000 0000 0000" />
          </label>
          <label className="field">
            <span>Karta egasi</span>
            <input value={s.cardHolder || ''} onChange={set('cardHolder')} placeholder="ISM FAMILIYA" />
          </label>
          <label className="field">
            <span>Karta turi</span>
            <select value={s.cardType || 'Uzcard'} onChange={set('cardType')}>
              <option>Uzcard</option>
              <option>Humo</option>
              <option>Visa</option>
            </select>
          </label>
        </div>
      </div>
      {err && <div className="notice notice-err">{err}</div>}
      <button className="btn btn-primary mt16">{ok ? '✓ Saqlandi' : 'Saqlash'}</button>
    </form>
  );
}
