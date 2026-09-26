// Ombor: razmer bo'yicha qoldiqlar
// "hisoblash" o'chiq = cheklov yo'q
import { useEffect, useMemo, useState } from 'react';
import { api, imgUrl } from '../lib/api';

function StockRow({ p, onSaved }) {
  const [pairsOn, setPairsOn] = useState(p.stockPairs !== null && p.stockPairs !== undefined);
  const [pairs, setPairs] = useState(() => Object.fromEntries(p.sizes.map((s) => [s, p.stockPairs?.[s] ?? 0])));
  const [inStock, setInStock] = useState(p.inStock);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/products/${p.id}/stock`, {
        stockPairs: pairsOn ? pairs : null,
        inStock,
      });
      setOk(true);
      setTimeout(() => setOk(false), 1500);
      onSaved?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td>
        <div className="row gap8">
          <img className="thumb" src={imgUrl(p.images[0])} alt="" />
          <div>
            <b className="small">{p.name}</b>
            <div className="small muted">{p.article}</div>
          </div>
        </div>
      </td>
      <td>
        <label className="check small">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> bor
        </label>
      </td>
      <td>
        <label className="check small">
          <input type="checkbox" checked={pairsOn} onChange={(e) => setPairsOn(e.target.checked)} /> hisoblash
        </label>
        {pairsOn && (
          <div className="size-stock">
            {p.sizes.map((s) => (
              <label key={s}>
                <span>{s}</span>
                <input
                  type="number"
                  min="0"
                  value={pairs[s]}
                  onChange={(e) => setPairs((x) => ({ ...x, [s]: Number(e.target.value) }))}
                />
              </label>
            ))}
          </div>
        )}
      </td>
      <td>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
          {ok ? '✓' : 'Saqlash'}
        </button>
      </td>
    </tr>
  );
}

export default function Stock({ meta }) {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    api.get('/products').then(setItems);
  }, []);

  const list = useMemo(
    () =>
      items.filter(
        (p) => (!cat || p.category === cat) && (!q || (p.name + p.article).toLowerCase().includes(q.toLowerCase()))
      ),
    [items, cat, q]
  );

  return (
    <div>
      <div className="page-head">
        <h1>Ombor</h1>
      </div>
      <p className="muted small">
        «Hisoblash» o'chiq bo'lsa — cheklov yo'q (qoldiq hisoblanmaydi). Buyurtma berilganda qoldiq avtomatik kamayadi, bekor
        qilinsa — qaytadi.
      </p>
      <div className="filters">
        <input placeholder="Qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {meta.categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.uz}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Sotuvda</th>
              <th>Qoldiq (razmer bo'yicha)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <StockRow key={p.id} p={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
