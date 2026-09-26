// Katalog: kategoriya, teg filtrlari, qidiruv, mahsulot kartalari
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import ProductCard from '../components/ProductCard';

export default function Catalog({ category, setCategory, onOpenProduct }) {
  const { t, lang, config, products } = useStore();
  const [tag, setTag] = useState(null);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!tag || p.tag === tag) &&
        (!s || [p.name, p.nameRu, p.article].some((x) => x && x.toLowerCase().includes(s)))
    );
  }, [products, category, tag, q]);

  const usedTags = config?.tags.filter((tg) => products.some((p) => p.tag === tg.key && (!category || p.category === category)));

  return (
    <div className="page">
      <h1 className="page-title">{t.catalog}</h1>
      <div className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} />
        {q && (
          <button onClick={() => setQ('')} aria-label="clear">
            ✕
          </button>
        )}
      </div>

      <div className="chips scroll-x">
        <button className={'chip' + (!category ? ' on' : '')} onClick={() => setCategory(null)}>
          {t.all}
        </button>
        {config?.categories.map((c) => (
          <button key={c.key} className={'chip' + (category === c.key ? ' on' : '')} onClick={() => setCategory(c.key)}>
            {c[lang] || c.uz}
          </button>
        ))}
      </div>
      {usedTags?.length > 1 && (
        <div className="chips scroll-x">
          {usedTags.map((tg) => (
            <button
              key={tg.key}
              className={'chip chip-outline' + (tag === tg.key ? ' on' : '')}
              onClick={() => setTag(tag === tg.key ? null : tg.key)}
            >
              #{tg[lang] || tg.uz}
            </button>
          ))}
        </div>
      )}

      {list.length ? (
        <div className="grid">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => onOpenProduct(p.id)} />
          ))}
        </div>
      ) : (
        <div className="empty">{t.nothing}</div>
      )}
    </div>
  );
}
