// Narxlarni FAQAT serverda hisoblash. Mini App yuborgan narxga ishonilmaydi.
//
// Savatcha elementi (Mini App'dan):
//   { productId, mode: 'wholesale' | 'retail', color, packs, sizeQty: { "M": 2 } }
//
// Optom  = komplekt: 1 komplekt = har razmerdan 1 tadan. Narx = optom narx × dona soni
// Dona   = razmer bo'yicha istalgan son, dona narxda
const prisma = require('../database/connection');
const { productColors, imageForColor } = require('../utils/colors');
const { effectiveWholesale, stockInfo } = require('../models/Product');
const Setting = require('../models/Setting');

const MAX_QTY = 999;

async function calculate(rawItems, lang = 'uz') {
  const settings = await Setting.getAll();
  const retailEnabled = settings.retailEnabled !== 'false';
  const wholesaleEnabled = settings.wholesaleEnabled !== 'false';

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

    const mode = raw.mode === 'wholesale' ? 'wholesale' : 'retail';
    let line;

    if (mode === 'wholesale') {
      if (!wholesaleEnabled) {
        errors.push(ru ? 'Оптовая продажа отключена' : 'Optom savdo vaqtincha o\'chirilgan');
        continue;
      }
      const packs = Math.min(MAX_QTY, Math.max(0, Math.floor(Number(raw.packs) || 0)));
      if (packs <= 0) continue;
      if (packs < p.wholesaleMin) {
        errors.push(ru ? `«${name}»: минимум ${p.wholesaleMin} компл.` : `«${name}»: kamida ${p.wholesaleMin} komplekt`);
        continue;
      }
      const sizes = p.sizes.length ? p.sizes : ['—'];
      const qty = packs * sizes.length;
      const unitPrice = effectiveWholesale(p);
      line = { mode, packs, sizes, sizeQty: null, qty, unitPrice, lineTotal: qty * unitPrice };
      if (p.stockPacks !== null && packs > p.stockPacks) {
        errors.push(ru ? `«${name}»: на складе ${p.stockPacks} компл.` : `«${name}»: omborda ${p.stockPacks} komplekt bor`);
      }
    } else {
      if (!retailEnabled) {
        errors.push(ru ? 'Розничная продажа отключена' : 'Donaga savdo vaqtincha o\'chirilgan');
        continue;
      }
      const sizeQty = {};
      const src = raw.sizeQty && typeof raw.sizeQty === 'object' ? raw.sizeQty : {};
      const allowed = p.sizes.length ? p.sizes : ['—'];
      for (const s of allowed) {
        const q = Math.min(MAX_QTY, Math.max(0, Math.floor(Number(src[s]) || 0)));
        if (q > 0) sizeQty[s] = q;
      }
      const qty = Object.values(sizeQty).reduce((a, b) => a + b, 0);
      if (qty <= 0) continue;
      line = { mode, packs: null, sizes: Object.keys(sizeQty), sizeQty, qty, unitPrice: p.price, lineTotal: qty * p.price };
      if (p.stockPairs && typeof p.stockPairs === 'object') {
        for (const [s, q] of Object.entries(sizeQty)) {
          const left = Number(p.stockPairs[s] ?? 0);
          if (q > left) errors.push(ru ? `«${name}» (${s}): на складе ${left}` : `«${name}» (${s}): omborda ${left} ta bor`);
        }
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
      ...line,
    });
  }

  const total = lines.reduce((a, l) => a + l.lineTotal, 0);
  const totalQty = lines.reduce((a, l) => a + l.qty, 0);
  return { lines, total, totalQty, errors, isWholesale: lines.some((l) => l.mode === 'wholesale') };
}

module.exports = { calculate };
