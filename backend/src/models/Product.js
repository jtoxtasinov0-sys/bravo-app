// Mahsulot: tozalash (admin formasidan) va mijozga ko'rsatish
const { normalizeColor, productColors } = require('../utils/colors');

const toInt = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const str = (v, max = 2000) => (v === undefined || v === null || v === '' ? null : String(v).slice(0, max));

// Admin paneldan kelgan ma'lumotni bazaga yozishga tayyorlaydi
function sanitize(body) {
  const images = (Array.isArray(body.images) ? body.images : []).filter((x) => typeof x === 'string').slice(0, 8);
  const frames = images.map((_, i) => {
    const f = (Array.isArray(body.imageFrames) && body.imageFrames[i]) || {};
    return {
      zoom: Math.min(3, Math.max(1, Number(f.zoom) || 1)),
      x: Math.min(100, Math.max(0, Number(f.x ?? 50))),
      y: Math.min(100, Math.max(0, Number(f.y ?? 50))),
    };
  });
  const colors = images.map((_, i) => normalizeColor(Array.isArray(body.imageColors) ? body.imageColors[i] : null));
  const sizes = (Array.isArray(body.sizes) ? body.sizes : String(body.sizes || '').split(','))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 20);

  return {
    article: String(body.article || '').trim().slice(0, 40),
    name: String(body.name || '').trim().slice(0, 200),
    nameRu: str(body.nameRu, 200),
    description: str(body.description),
    descriptionRu: str(body.descriptionRu),
    category: String(body.category || '').trim(),
    tag: str(body.tag, 40),
    material: str(body.material, 100),
    materialRu: str(body.materialRu, 100),
    images,
    imageFrames: frames,
    imageColors: colors,
    price: toInt(body.price) ?? 0,
    oldPrice: toInt(body.oldPrice),
    wholesalePrice: toInt(body.wholesalePrice),
    wholesaleMin: Math.max(1, toInt(body.wholesaleMin) || 1),
    sizes,
    unit: body.unit === 'juft' ? 'juft' : 'dona',
    inStock: body.inStock !== false,
    isActive: body.isActive !== false,
    isPopular: !!body.isPopular,
    sortOrder: toInt(body.sortOrder) || 0,
    instagram: str(body.instagram, 300),
  };
}

// Optom narx dona narxidan arzon bo'lsagina qo'llanadi
function effectiveWholesale(p) {
  return p.wholesalePrice && p.wholesalePrice < p.price ? p.wholesalePrice : p.price;
}

// Ombordagi umumiy qoldiq holati (mijoz uchun)
function stockInfo(p) {
  const pairs = p.stockPairs && typeof p.stockPairs === 'object' ? p.stockPairs : null;
  const pairsTotal = pairs ? Object.values(pairs).reduce((a, b) => a + (Number(b) || 0), 0) : null;
  // null — cheklov yo'q. Optom ham, dona ham 0 bo'lsagina "tugagan"
  const packs = p.stockPacks ?? null;
  const soldOut = !p.inStock || (packs !== null && packs <= 0 && pairsTotal !== null && pairsTotal <= 0);
  return { stockPacks: p.stockPacks ?? null, stockPairs: pairs, pairsTotal, soldOut };
}

// Mini App uchun ko'rinish
function toPublic(p) {
  return {
    id: p.id,
    article: p.article,
    name: p.name,
    nameRu: p.nameRu,
    description: p.description,
    descriptionRu: p.descriptionRu,
    category: p.category,
    tag: p.tag,
    material: p.material,
    materialRu: p.materialRu,
    images: p.images,
    imageFrames: p.imageFrames || [],
    imageColors: p.imageColors || [],
    colors: productColors(p),
    price: p.price,
    oldPrice: p.oldPrice,
    wholesalePrice: effectiveWholesale(p),
    wholesaleMin: p.wholesaleMin,
    sizes: p.sizes,
    unit: p.unit,
    isPopular: p.isPopular,
    instagram: p.instagram,
    ...stockInfo(p),
  };
}

module.exports = { sanitize, toPublic, effectiveWholesale, stockInfo };
