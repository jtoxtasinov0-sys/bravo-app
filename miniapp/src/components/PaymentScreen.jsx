// To'lov oynasi: karta raqami (nusxalash), summa, Click havolasi, chek yuklash
import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { haptic, openLink } from '../lib/telegram';
import { useBack } from '../lib/back';

export default function PaymentScreen({ order, payment, onDone }) {
  const { t, lang } = useStore();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(order.paymentStatus === 'pending');
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  useBack(onDone);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payment.card.number.replace(/\s/g, ''));
    } catch {
      /* eski brauzer */
    }
    haptic.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      await api.upload(`/orders/${order.id}/receipt`, file);
      haptic.success();
      setSent(true);
    } catch (e2) {
      haptic.error();
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-overlay">
      <h1 className="page-title">
        {t.payTitle} · #{order.id}
      </h1>

      <div className="pay-amount">
        <div className="muted small">{t.payAmount}</div>
        <div className="pay-sum">{money(payment.amount, lang)}</div>
      </div>

      {payment.clickUrl && (
        <button className="btn btn-click btn-block" onClick={() => openLink(payment.clickUrl)}>
          {t.payClick}
        </button>
      )}

      {payment.card && (
        <div className="pay-card">
          <div className="muted small">{t.payCard}</div>
          <div className="pay-card-num">{payment.card.number}</div>
          <div className="row between">
            <div className="small">
              {payment.card.holder}
              {payment.card.type ? ` · ${payment.card.type}` : ''}
            </div>
            <button className="btn btn-light btn-sm" onClick={copy}>
              {copied ? '✓ ' + t.copied : t.copy}
            </button>
          </div>
        </div>
      )}

      {sent ? (
        <div className="notice notice-ok">✅ {t.receiptSent}</div>
      ) : (
        <>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
          <button className="btn btn-primary btn-block" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? t.sending : '🧾 ' + t.uploadReceipt}
          </button>
          <p className="muted small center">{t.receiptHint}</p>
        </>
      )}
      {err && <div className="notice notice-err">{err}</div>}

      <button className="btn btn-ghost btn-block" onClick={onDone}>
        {sent ? t.done : t.later}
      </button>
    </div>
  );
}
