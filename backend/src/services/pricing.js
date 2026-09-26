// Narxlarni FAQAT serverda hisoblash. Mini App yuborgan narxga ishonilmaydi.
//
// Savatcha elementi (Mini App'dan):
//   { productId, color, sizeQty: { "M": 2 } }
//
// Razmer bo'yicha istalgan son, dona narxda
const prisma = require('../database/connection');
const { productColors, imageForColor } = require('../utils/colors');
const { stockInfo } = require('../models/Product');

const MAX_QTY = 999;

async function calculate(rawItems, lang = 'uz') {
  const items = Array.isArray(rawItems) ? rawItems.slice(0, 100) : [];
  const ids = [...new Set(items.map((i) => Number(i.productId)).filter(Number.isInteger))];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  const errors = [];
  const ru = lang === 'ru';

  for (const raw of items) {
    const p = byId.get(Number(raw.productId));
    if (!p || !p.isActive) {
      errors.push(ru ? 'Товар больше не продаётся' : 'Mahsulot endi sotuvda yo\'q');
      continue;
    }
    const name = (ru && p.nameRu) || p.name;
    const st = stockInfo(p);
    if (st.soldOut) {
      errors.push(ru ? `«${name}» закончился` : `«${name}» tugagan`);
      continue;
    }

    // Rang — faqat mahsulotda bor ranglardan; tanlanmasa birinchi rang
    const colors = productColors(p);
    let color = colors.find((c) => c.name.toLowerCase() === String(raw.color || '').toLowerCase());
    if (!color) color = colors[0] || null;

    const sizeQty = {};
    const src = raw.sizeQty && typeof raw.sizeQty === 'object' ? raw.sizeQty : {};
    const allowed = p.sizes.length ? p.sizes : ['—'];
    for (const s of allowed) {
      const q = Math.min(MAX_QTY, Math.max(0, Math.floor(Number(src[s]) || 0)));
      if (q > 0) sizeQty[s] = q;
    }
    const qty = Object.values(sizeQty).reduce((a, b) => a + b, 0);
    if (qty <= 0) continue;
    if (p.stockPairs && typeof p.stockPairs === 'object') {
      for (const [s, q] of Object.entries(sizeQty)) {
        const left = Number(p.stockPairs[s] ?? 0);
        if (q > left) errors.push(ru ? `«${name}» (${s}): на складе ${left}` : `«${name}» (${s}): omborda ${left} ta bor`);
      }
    }

    lines.push({
      key: raw.key ? String(raw.key).slice(0, 100) : undefined, // Mini App savatchasidagi kalit
      productId: p.id,
      article: p.article,
      name,
      unit: p.unit,
      image: imageForColor(p, color && color.name),
      color: color ? color.name : null,
      colorHex: color ? color.hex : null,
      sizes: Object.keys(sizeQty),
      sizeQty,
      qty,
      unitPrice: p.price,
      lineTotal: qty * p.price,
    });
  }

  const total = lines.reduce((a, l) => a + l.lineTotal, 0);
  const totalQty = lines.reduce((a, l) => a + l.qty, 0);
  return { lines, total, totalQty, errors };
}

module.exports = { calculate };
