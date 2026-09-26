// Buyurtmalar: statistika, jadval, filtr, holatni o'zgartirish, chek, o'chirish, tozalash
import { useCallback, useEffect, useState } from 'react';
import { api, imgUrl, money, date } from '../lib/api';
import { STATUS, PAY_STATUS, PAY_METHOD, ColorDot } from '../lib/colors';

function Stat({ label, value, accent }) {
  return (
    <div className={'stat card' + (accent ? ' stat-accent' : '')}>
      <div className="muted small">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function OrderDetail({ order, onClose, onChange, onDelete }) {
  const [receipt, setReceipt] = useState(false);
  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>Buyurtma #{order.id}</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="muted small">{date(order.createdAt)}</div>

        <div className="detail-grid">
          <div>
            <div className="label">Mijoz</div>
            <b>{order.customerName}</b>
            <div>
              <a href={`tel:${order.phone}`}>{order.phone}</a>
            </div>
            <div className="small">
              {order.region}, {order.address}
            </div>
            {order.comment && <div className="small muted">💬 {order.comment}</div>}
            {order.telegramId && /^\d+$/.test(order.telegramId) && (
              <a className="small link" href={`tg://user?id=${order.telegramId}`}>
                Telegramda yozish
              </a>
            )}
          </div>
          <div>
            <div className="label">Holat</div>
            <select value={order.status} onChange={(e) => onChange(order, { status: e.target.value })}>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <div className="label mt8">To'lov: {PAY_METHOD[order.paymentMethod]}</div>
            <select value={order.paymentStatus} onChange={(e) => onChange(order, { paymentStatus: e.target.value })}>
              {Object.entries(PAY_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            {order.receiptUrl && (
              <button className="btn btn-light btn-sm mt8" onClick={() => setReceipt(!receipt)}>
                🧾 Chekni {receipt ? 'yashirish' : "ko'rish"}
              </button>
            )}
          </div>
        </div>
        {receipt && (
          <a href={imgUrl(order.receiptUrl)} target="_blank" rel="noreferrer">
            <img className="receipt" src={imgUrl(order.receiptUrl)} alt="chek" />
          </a>
        )}

        <div className="label mt16">Mahsulotlar</div>
        {order.items.map((it, i) => (
          <div key={i} className="order-line">
            <img src={imgUrl(it.image)} alt="" />
            <div className="grow">
              <b>{it.name}</b>
              <div className="small muted">
                {it.article} · {it.color ? <><ColorDot hex={it.colorHex} size={10} /> {it.color}</> : 'rang belgilanmagan'}
              </div>
              <div className="small">
                {Object.entries(it.sizeQty || {})
                  .map(([s, q]) => `${s}×${q}`)
                  .join(', ')}
              </div>
            </div>
            <div className="right small">
              {it.qty} × {money(it.unitPrice)}
              <br />
              <b>{money(it.lineTotal)}</b>
            </div>
          </div>
        ))}
        <div className="row between mt16">
          <button
            className="btn btn-danger-ghost btn-sm"
            onClick={() => {
              if (confirm(`#${order.id} buyurtmani o'chirasizmi?`)) onDelete(order);
            }}
          >
            O'chirish
          </button>
          <div className="total">
            Jami: {order.totalQty} ta · <b>{money(order.total)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [payStatus, setPayStatus] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (payStatus) params.set('paymentStatus', payStatus);
      if (q) params.set('q', q);
      const [s, o] = await Promise.all([api.get('/stats'), api.get('/orders?' + params)]);
      setStats(s);
      setOrders(o);
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, [status, payStatus, q]);

  // Har 30 soniyada yangilanadi
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const change = async (order, patch) => {
    try {
      const updated = await api.patch(`/orders/${order.id}`, patch);
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      setOpen((o) => (o && o.id === updated.id ? updated : o));
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const remove = async (order) => {
    await api.del(`/orders/${order.id}`);
    setOpen(null);
    load();
  };

  const clearAll = async () => {
    const word = prompt("DIQQAT! Barcha buyurtmalar o'chiriladi va raqamlash #1 dan boshlanadi.\nTasdiqlash uchun TOZALASH deb yozing:");
    if (word !== 'TOZALASH') return;
    try {
      await api.post('/orders/clear', { confirm: 'TOZALASH' });
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Buyurtmalar</h1>
        <button className="btn btn-danger-ghost btn-sm" onClick={clearAll}>
          🗑 Hammasini tozalash
        </button>
      </div>

      {stats && (
        <div className="stats">
          <Stat label="Bugungi buyurtmalar" value={stats.ordersToday} accent />
          <Stat label="Bugungi savdo" value={money(stats.revenueToday)} />
          <Stat label="Jami buyurtmalar" value={stats.orders} />
          <Stat label="Jami savdo" value={money(stats.revenue)} />
          <Stat label="Yangi (ko'rilmagan)" value={stats.byStatus.new || 0} />
          <Stat label="Chek tekshirish kerak" value={stats.pendingPayments} />
          <Stat label="Mijozlar" value={stats.users} />
          <Stat label="Faol mahsulotlar" value={stats.products} />
        </div>
      )}

      <div className="filters">
        <input placeholder="Qidirish: ism, telefon, #raqam" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Barcha holatlar</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
          <option value="">Barcha to'lovlar</option>
          {Object.entries(PAY_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      {err && <div className="notice notice-err">{err}</div>}

      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sana</th>
              <th>Mijoz</th>
              <th>Mahsulotlar</th>
              <th>Summa</th>
              <th>To'lov</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => setOpen(o)} className={o.status === 'new' ? 'row-new' : ''}>
                <td>
                  <b>#{o.id}</b>
                </td>
                <td className="small nowrap">{date(o.createdAt)}</td>
                <td>
                  {o.customerName}
                  <div className="small muted">{o.phone}</div>
                  <div className="small muted">{o.region}</div>
                </td>
                <td>
                  <div className="thumbs">
                    {o.items.slice(0, 4).map((it, i) => (
                      <img key={i} src={imgUrl(it.image)} alt="" title={it.name} />
                    ))}
                    {o.items.length > 4 && <span>+{o.items.length - 4}</span>}
                  </div>
                </td>
                <td className="nowrap">
                  <b>{money(o.total)}</b>
                  <div className="small muted">{o.totalQty} ta</div>
                </td>
                <td>
                  <div className="small">{PAY_METHOD[o.paymentMethod]}</div>
                  {o.paymentMethod !== 'cash' && <span className={'status ' + PAY_STATUS[o.paymentStatus].cls}>{PAY_STATUS[o.paymentStatus].label}</span>}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className={'status-select ' + STATUS[o.status].cls}
                    value={o.status}
                    onChange={(e) => change(o, { status: e.target.value })}
                  >
                    {Object.entries(STATUS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7} className="empty">
                  Buyurtmalar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <OrderDetail order={open} onClose={() => setOpen(null)} onChange={change} onDelete={remove} />}
    </div>
  );
}
