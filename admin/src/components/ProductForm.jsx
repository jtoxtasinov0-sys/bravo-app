// Mahsulot qo'shish / tahrirlash formasi
import { useState } from 'react';
import { api, money } from '../lib/api';
import ImagePicker from './ImagePicker';

const EMPTY = {
  article: '',
  name: '',
  nameRu: '',
  description: '',
  descriptionRu: '',
  category: '',
  tag: '',
  material: '',
  materialRu: '',
  images: [],
  imageFrames: [],
  imageColors: [],
  price: '',
  oldPrice: '',
  wholesalePrice: '',
  wholesaleMin: 1,
  sizes: [],
  unit: 'dona',
  inStock: true,
  isActive: true,
  isPopular: false,
  sortOrder: 0,
  instagram: '',
};

export default function ProductForm({ product, meta, onSaved, onClose }) {
  const [f, setF] = useState(() => {
    const p = { ...EMPTY, ...(product || {}) };
    for (const k of Object.keys(p)) if (p[k] === null) p[k] = EMPTY[k] ?? '';
    return p;
  });
  const [lang, setLang] = useState('uz');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((x) => ({ ...x, [k]: v }));
  };

  // Kategoriya tanlansa — standart razmer va birlikni qo'yamiz (agar hali bo'sh bo'lsa)
  const setCategory = (e) => {
    const c = meta.categories.find((x) => x.key === e.target.value);
    setF((x) => ({
      ...x,
      category: e.target.value,
      sizes: x.sizes.length ? x.sizes : c?.sizes || [],
      unit: c?.unit || x.unit,
    }));
  };

  const cat = meta.categories.find((c) => c.key === f.category);
  const suggestedSizes = [...new Set([...(cat?.sizes || []), ...f.sizes])];
  const toggleSize = (s) =>
    setF((x) => {
      const has = x.sizes.includes(s);
      const next = has ? x.sizes.filter((y) => y !== s) : [...x.sizes, s];
      return { ...x, sizes: suggestedSizes.filter((y) => next.includes(y)).concat(next.filter((y) => !suggestedSizes.includes(y))) };
    });
  const [newSize, setNewSize] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const saved = product?.id ? await api.put(`/products/${product.id}`, f) : await api.post('/products', f);
      onSaved(saved);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const wp = Number(f.wholesalePrice) || 0;
  const pr = Number(f.price) || 0;

  return (
    <div className="modal-wrap" onClick={onClose}>
      <form className="modal modal-lg" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div className="row between">
          <h2>{product?.id ? 'Mahsulotni tahrirlash' : "Yangi mahsulot"}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="label mt16">Rasmlar (birinchisi — asosiy)</div>
        <ImagePicker
          value={{ images: f.images, imageFrames: f.imageFrames, imageColors: f.imageColors }}
          presets={meta.presetColors}
          onChange={(v) => setF((x) => ({ ...x, ...v }))}
        />

        <div className="form-grid mt16">
          <label className="field">
            <span>Artikul *</span>
            <input value={f.article} onChange={set('article')} placeholder="BR-042" required />
          </label>
          <label className="field">
            <span>Kategoriya *</span>
            <select value={f.category} onChange={setCategory} required>
              <option value="">— tanlang —</option>
              {meta.categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.uz}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Teg (filtr)</span>
            <select value={f.tag} onChange={set('tag')}>
              <option value="">— yo'q —</option>
              {meta.tags.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.uz}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>O'lchov birligi</span>
            <select value={f.unit} onChange={set('unit')}>
              {Object.entries(meta.units).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.uz}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tabs-mini mt16">
          <button type="button" className={lang === 'uz' ? 'on' : ''} onClick={() => setLang('uz')}>
            🇺🇿 O'zbekcha
          </button>
          <button type="button" className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>
            🇷🇺 Русский
          </button>
        </div>
        {lang === 'uz' ? (
          <>
            <label className="field">
              <span>Nomi *</span>
              <input value={f.name} onChange={set('name')} required />
            </label>
            <label className="field">
              <span>Material</span>
              <input value={f.material} onChange={set('material')} placeholder="Paxta 100%" />
            </label>
            <label className="field">
              <span>Tavsif</span>
              <textarea rows={3} value={f.description} onChange={set('description')} />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>Название (bo'sh bo'lsa — o'zbekchasi ko'rinadi)</span>
              <input value={f.nameRu} onChange={set('nameRu')} />
            </label>
            <label className="field">
              <span>Материал</span>
              <input value={f.materialRu} onChange={set('materialRu')} />
            </label>
            <label className="field">
              <span>Описание</span>
              <textarea rows={3} value={f.descriptionRu} onChange={set('descriptionRu')} />
            </label>
          </>
        )}

        <div className="form-grid mt8">
          <label className="field">
            <span>Dona narx (so'm) *</span>
            <input type="number" min="0" value={f.price} onChange={set('price')} required />
          </label>
          <label className="field">
            <span>Eski narx (chizilgan)</span>
            <input type="number" min="0" value={f.oldPrice} onChange={set('oldPrice')} />
          </label>
          <label className="field">
            <span>Optom narx (1 {meta.units[f.unit]?.uz || 'dona'})</span>
            <input type="number" min="0" value={f.wholesalePrice} onChange={set('wholesalePrice')} />
          </label>
          <label className="field">
            <span>Optomda kamida (komplekt)</span>
            <input type="number" min="1" value={f.wholesaleMin} onChange={set('wholesaleMin')} />
          </label>
        </div>
        {wp > 0 && pr > 0 && wp >= pr && (
          <div className="notice notice-warn">⚠️ Optom narx dona narxidan arzon emas — optomda ham dona narx qo'llanadi.</div>
        )}
        {wp > 0 && f.sizes.length > 0 && (
          <div className="muted small">
            1 komplekt = {f.sizes.length} {meta.units[f.unit]?.uz} × {money(wp)} = <b>{money(wp * f.sizes.length)}</b>
          </div>
        )}

        <div className="label mt16">Razmerlar</div>
        <div className="chips">
          {suggestedSizes.map((s) => (
            <button type="button" key={s} className={'chip' + (f.sizes.includes(s) ? ' on' : '')} onClick={() => toggleSize(s)}>
              {s}
            </button>
          ))}
          <input
            className="chip-input"
            placeholder="+ razmer"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const s = newSize.trim();
                if (s && !f.sizes.includes(s)) setF((x) => ({ ...x, sizes: [...x.sizes, s] }));
                setNewSize('');
              }
            }}
          />
        </div>

        <div className="form-grid mt16">
          <label className="field">
            <span>Tartib raqami (kichigi oldinda)</span>
            <input type="number" value={f.sortOrder} onChange={set('sortOrder')} />
          </label>
          <label className="field">
            <span>Instagram havola</span>
            <input value={f.instagram} onChange={set('instagram')} />
          </label>
        </div>
        <div className="row gap16 wrap">
          <label className="check">
            <input type="checkbox" checked={f.isActive} onChange={set('isActive')} /> Faol (Mini App'da ko'rinadi)
          </label>
          <label className="check">
            <input type="checkbox" checked={f.inStock} onChange={set('inStock')} /> Sotuvda bor
          </label>
          <label className="check">
            <input type="checkbox" checked={f.isPopular} onChange={set('isPopular')} /> Mashhur (bosh sahifada)
          </label>
        </div>

        {err && <div className="notice notice-err">{err}</div>}
        <div className="row between mt16">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Bekor qilish
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}
