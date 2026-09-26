// Mahsulotlar ro'yxati: qo'shish / tahrirlash / o'chirish
import { useEffect, useMemo, useState } from 'react';
import { api, imgUrl, money } from '../lib/api';
import { frameStyle } from '../lib/frame';
import { ColorDot } from '../lib/colors';
import ProductForm from '../components/ProductForm';

export default function Products({ meta }) {
  const [items, setItems] = useState([]);
  const [edit, setEdit] = useState(null); // null | {} | product
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');

  const load = () => api.get('/products').then(setItems).catch((e) => alert(e.message));
  useEffect(() => {
    load();
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (p) => (!cat || p.category === cat) && (!s || p.name.toLowerCase().includes(s) || p.article.toLowerCase().includes(s))
    );
  }, [items, cat, q]);

  const remove = async (p) => {
    if (!confirm(`«${p.name}» o'chirilsinmi? (Vaqtincha yashirish uchun "Faol" belgisini olib tashlang)`)) return;
    await api.del(`/products/${p.id}`);
    load();
  };

  const toggleActive = async (p) => {
    await api.put(`/products/${p.id}`, { ...p, isActive: !p.isActive });
    load();
  };

  const catName = (k) => meta.categories.find((c) => c.key === k)?.uz || k;

  return (
    <div>
      <div className="page-head">
        <h1>Mahsulotlar ({items.length})</h1>
        <button className="btn btn-primary" onClick={() => setEdit({})}>
          + Yangi mahsulot
        </button>
      </div>
      <div className="filters">
        <input placeholder="Nomi yoki artikul" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {meta.categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.uz}
            </option>
          ))}
        </select>
      </div>

      <div className="product-grid">
        {list.map((p) => {
          const colors = [...new Map((p.imageColors || []).filter(Boolean).map((c) => [c.name, c])).values()];
          return (
            <div key={p.id} className={'product-card card' + (p.isActive ? '' : ' inactive')}>
              <div className="product-img" onClick={() => setEdit(p)}>
                {p.images[0] && <img src={imgUrl(p.images[0])} alt="" style={frameStyle(p.imageFrames?.[0])} />}
                {!p.isActive && <span className="pill pill-gray">Nofaol</span>}
                {p.isActive && !p.inStock && <span className="pill pill-red">Tugagan</span>}
                {p.isPopular && <span className="pill pill-star">★</span>}
                {p.images.length > 1 && <span className="pill pill-count">{p.images.length} rasm</span>}
              </div>
              <div className="product-body">
                <div className="small muted">
                  {p.article} · {catName(p.category)}
                </div>
                <b className="product-name">{p.name}</b>
                <div className="row gap6">
                  {colors.map((c) => (
                    <ColorDot key={c.name} hex={c.hex} size={12} />
                  ))}
                  <span className="small muted">{p.sizes.join(', ')}</span>
                </div>
                <div className="small">
                  Dona: <b>{money(p.price)}</b>
                  {p.wholesalePrice ? (
                    <>
                      {' '}
                      · Optom: <b>{money(p.wholesalePrice)}</b>
                    </>
                  ) : null}
                </div>
                <div className="row gap6 mt8">
                  <button className="btn btn-light btn-sm" onClick={() => setEdit(p)}>
                    Tahrirlash
                  </button>
                  <button className="btn btn-light btn-sm" onClick={() => toggleActive(p)}>
                    {p.isActive ? 'Yashirish' : "Ko'rsatish"}
                  </button>
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => remove(p)}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {edit && (
        <ProductForm
          product={edit.id ? edit : null}
          meta={meta}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </div>
  );
}
