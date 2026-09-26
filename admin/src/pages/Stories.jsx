// Storylar: rasm, sarlavha uz/ru, mahsulotga bog'lash
import { useEffect, useRef, useState } from 'react';
import { api, imgUrl } from '../lib/api';

const EMPTY = { title: '', titleRu: '', image: '', productId: '', isActive: true, sortOrder: 0 };

export default function Stories() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [f, setF] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get('/stories').then(setItems);
  useEffect(() => {
    load();
    api.get('/products').then(setProducts);
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await api.upload('stories', file);
      setF((x) => ({ ...x, image: r.url }));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/stories/${editId}`, f);
      else await api.post('/stories', f);
      setF(EMPTY);
      setEditId(null);
      load();
    } catch (e2) {
      alert(e2.message);
    }
  };

  const remove = async (s) => {
    if (!confirm("Story o'chirilsinmi?")) return;
    await api.del(`/stories/${s.id}`);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <h1>Storylar</h1>
      </div>
      <div className="two-col">
        <form className="card pad" onSubmit={save}>
          <h3>{editId ? 'Storyni tahrirlash' : "Yangi story"}</h3>
          <div
            className="story-upload"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              upload(e.dataTransfer.files?.[0]);
            }}
          >
            {f.image ? <img src={imgUrl(f.image)} alt="" /> : <span>{busy ? 'Yuklanmoqda…' : '+ Rasm (9:16 tavsiya)'}</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          <label className="field">
            <span>Sarlavha (uz) *</span>
            <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
          </label>
          <label className="field">
            <span>Заголовок (ru)</span>
            <input value={f.titleRu || ''} onChange={(e) => setF({ ...f, titleRu: e.target.value })} />
          </label>
          <label className="field">
            <span>Mahsulotga bog'lash (ixtiyoriy)</span>
            <select value={f.productId || ''} onChange={(e) => setF({ ...f, productId: e.target.value })}>
              <option value="">— yo'q —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.article} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="row gap16">
            <label className="field grow">
              <span>Tartib</span>
              <input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} />
            </label>
            <label className="check">
              <input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> Faol
            </label>
          </div>
          <div className="row gap8">
            <button className="btn btn-primary" disabled={!f.image || busy}>
              Saqlash
            </button>
            {editId && (
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setF(EMPTY);
                  setEditId(null);
                }}
              >
                Bekor
              </button>
            )}
          </div>
        </form>

        <div className="story-list">
          {items.map((s) => (
            <div key={s.id} className={'story-item card' + (s.isActive ? '' : ' inactive')}>
              <img src={imgUrl(s.image)} alt="" />
              <div className="grow">
                <b>{s.title}</b>
                <div className="small muted">{s.titleRu}</div>
                {s.productId && <div className="small">🔗 {products.find((p) => p.id === s.productId)?.name || '#' + s.productId}</div>}
              </div>
              <div className="col gap6">
                <button
                  className="btn btn-light btn-sm"
                  onClick={() => {
                    setEditId(s.id);
                    setF({ ...EMPTY, ...s, productId: s.productId || '' });
                  }}
                >
                  Tahrirlash
                </button>
                <button className="btn btn-danger-ghost btn-sm" onClick={() => remove(s)}>
                  O'chirish
                </button>
              </div>
            </div>
          ))}
          {!items.length && <div className="empty">Storylar yo'q</div>}
        </div>
      </div>
    </div>
  );
}
