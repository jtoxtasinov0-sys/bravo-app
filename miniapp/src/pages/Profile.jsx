// Profil: ma'lumotlar, til, buyurtmalarim, bog'lanish
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { api } from '../lib/api';
import { money, date } from '../lib/format';
import { tgUser, openTgLink, haptic } from '../lib/telegram';
import { imgUrl } from '../lib/image';

const STATUS_CLASS = { new: 'st-blue', confirmed: 'st-green', delivered: 'st-gray', cancelled: 'st-red' };
const PAY_CLASS = { unpaid: 'st-gray', pending: 'st-orange', paid: 'st-green', rejected: 'st-red' };

export default function Profile({ onPay, onCart }) {
  const { t, lang, setLang, user, demo, config, addToCart } = useStore();
  const [orders, setOrders] = useState(null);
  const tu = tgUser();

  useEffect(() => {
    api
      .get('/orders/my')
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const reorder = (o) => {
    for (const it of o.items) {
      addToCart({
        productId: it.productId,
        mode: it.mode,
        color: it.color,
        packs: it.mode === 'wholesale' ? it.packs : null,
        sizeQty: it.mode === 'wholesale' ? null : it.sizeQty,
      });
    }
    haptic.success();
    onCart();
  };

  const name = [tu?.first_name || user?.firstName, tu?.last_name || user?.lastName].filter(Boolean).join(' ');

  return (
    <div className="page">
      <h1 className="page-title">{t.profile}</h1>

      <div className="profile-card">
        <div className="avatar">
          {tu?.photo_url ? <img src={tu.photo_url} alt="" /> : (name || 'B').slice(0, 1).toUpperCase()}
        </div>
        <div>
          <b>{name || '—'}</b>
          <div className="muted small">{tu?.username ? '@' + tu.username : user?.phone || ''}</div>
          {demo && <div className="tag-demo">{t.demo}</div>}
        </div>
      </div>

      <div className="form-card row between">
        <span>{t.language}</span>
        <div className="seg seg-sm">
          <button className={lang === 'uz' ? 'on' : ''} onClick={() => setLang('uz')}>
            O'zbekcha
          </button>
          <button className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>
            Русский
          </button>
        </div>
      </div>

      <div className="section-head">
        <h2>{t.myOrders}</h2>
      </div>
      {orders === null ? (
        <div className="skeleton" />
      ) : orders.length === 0 ? (
        <div className="empty">{t.noOrders}</div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="order-card">
            <div className="row between">
              <b>#{o.id}</b>
              <span className="muted small">{date(o.createdAt, lang)}</span>
            </div>
            <div className="order-thumbs">
              {o.items.slice(0, 5).map((it, i) => (
                <img key={i} src={imgUrl(it.image)} alt="" />
              ))}
              {o.items.length > 5 && <span>+{o.items.length - 5}</span>}
            </div>
            <div className="row between">
              <div className="row gap6">
                <span className={'status ' + STATUS_CLASS[o.status]}>{t.status[o.status]}</span>
                {o.paymentMethod !== 'cash' && (
                  <span className={'status ' + PAY_CLASS[o.paymentStatus]}>{t.payStatus[o.paymentStatus]}</span>
                )}
              </div>
              <b>{money(o.total, lang)}</b>
            </div>
            <div className="row gap6 mt8">
              {o.paymentMethod !== 'cash' && ['unpaid', 'rejected'].includes(o.paymentStatus) && o.status !== 'cancelled' && (
                <button className="btn btn-primary btn-sm" onClick={() => onPay(o.id)}>
                  {t.pay}
                </button>
              )}
              <button className="btn btn-light btn-sm" onClick={() => reorder(o)}>
                ↻ {t.reorder}
              </button>
            </div>
          </div>
        ))
      )}

      <div className="section-head">
        <h2>{t.contact}</h2>
      </div>
      <div className="form-card">
        <div className="small">📍 {config?.company?.address}</div>
        <div className="row gap6 mt8">
          <a className="btn btn-light btn-sm" href={`tel:${config?.company?.phone}`}>
            📞 {config?.company?.phone}
          </a>
          <button className="btn btn-light btn-sm" onClick={() => openTgLink(`https://t.me/${config?.botUsername}`)}>
            ✈️ {t.writeBot}
          </button>
          {config?.company?.instagram && (
            <a className="btn btn-light btn-sm" href={config.company.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
