// Bosh sahifa: salomlashish, storylar, banner, kategoriyalar, mashhur mahsulotlar
import { useStore } from '../lib/store';
import { tgUser } from '../lib/telegram';
import Stories from '../components/Stories';
import ProductCard from '../components/ProductCard';
import Img from '../components/Img';

export default function Home({ onOpenProduct, onOpenCategory }) {
  const { t, lang, user, config, products } = useStore();
  const name = tgUser()?.first_name || user?.firstName || '';
  const popular = products.filter((p) => p.isPopular);
  const list = (popular.length ? popular : products).slice(0, 8);

  // Har kategoriya uchun birinchi mahsulot rasmi
  const cover = (key) => products.find((p) => p.category === key);
  const heroP = popular.find((p) => p.category === 'komplekt') || products[0];

  return (
    <div className="page">
      <header className="home-head">
        <div>
          <div className="muted small">
            {t.hello}
            {name ? ',' : ''}
          </div>
          <h1 className="home-name">{name || 'Bravo'} 👋</h1>
        </div>
        <img className="home-logo" src="/logo.png" onError={(e) => (e.currentTarget.src = '/logo.svg')} alt="" />
      </header>

      <Stories onOpenProduct={onOpenProduct} />

      <section className="hero" onClick={() => onOpenCategory(null)}>
        <div className="hero-text">
          <div className="hero-brand">BRAVO</div>
          <div className="hero-slogan">{lang === 'ru' ? config?.company?.sloganRu : config?.company?.slogan}</div>
          <span className="hero-btn">{t.catalog} →</span>
        </div>
        {heroP && <Img src={heroP.images[0]} frame={heroP.imageFrames?.[0]} className="hero-img" />}
      </section>

      <div className="section-head">
        <h2>{t.categories}</h2>
      </div>
      <div className="cat-grid">
        {config?.categories.map((c) => {
          const p = cover(c.key);
          return (
            <button key={c.key} className="cat-card" onClick={() => onOpenCategory(c.key)}>
              {p && <Img src={p.images[0]} frame={p.imageFrames?.[0]} />}
              <span>{c[lang] || c.uz}</span>
            </button>
          );
        })}
      </div>

      <div className="section-head">
        <h2>{t.popular}</h2>
        <button className="link" onClick={() => onOpenCategory(null)}>
          {t.seeAll}
        </button>
      </div>
      <div className="grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} onOpen={() => onOpenProduct(p.id)} />
        ))}
      </div>
    </div>
  );
}
