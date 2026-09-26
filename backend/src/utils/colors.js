// Tayyor ranglar ro'yxati. Admin qo'lda istalgan nom va #hex kiritishi ham mumkin.
const PRESET_COLORS = [
  { name: 'Qora', ru: 'Чёрный', hex: '#111111' },
  { name: 'Oq', ru: 'Белый', hex: '#f5f5f5' },
  { name: "To'q ko'k", ru: 'Тёмно-синий', hex: '#1b2a4e' },
  { name: "Ko'k", ru: 'Синий', hex: '#2f5fb3' },
  { name: 'Moviy', ru: 'Голубой', hex: '#7fb3e0' },
  { name: 'Kulrang', ru: 'Серый', hex: '#8a8d91' },
  { name: 'Bej', ru: 'Бежевый', hex: '#d8c3a5' },
  { name: 'Jigarrang', ru: 'Коричневый', hex: '#6b4226' },
  { name: 'Xaki', ru: 'Хаки', hex: '#7d7a4f' },
  { name: 'Zaytun', ru: 'Оливковый', hex: '#6b6b3a' },
  { name: 'Yashil', ru: 'Зелёный', hex: '#2e7d4f' },
  { name: 'Terrakota', ru: 'Терракотовый', hex: '#c0603c' },
  { name: "To'q sariq", ru: 'Оранжевый', hex: '#e07b1a' },
  { name: 'Qizil', ru: 'Красный', hex: '#d32f2f' },
];

// Rang obyektini tekshirib, toza ko'rinishga keltiradi
function normalizeColor(c) {
  if (!c || typeof c !== 'object' || !c.name) return null;
  const hex = /^#[0-9a-f]{3,8}$/i.test(c.hex || '') ? c.hex : '#cccccc';
  return { name: String(c.name).slice(0, 40), hex };
}

// Mahsulotdagi takrorlanmas ranglar (rasmlar tartibida)
function productColors(product) {
  const list = Array.isArray(product.imageColors) ? product.imageColors : [];
  const seen = new Set();
  const out = [];
  for (const c of list) {
    const n = normalizeColor(c);
    if (n && !seen.has(n.name.toLowerCase())) {
      seen.add(n.name.toLowerCase());
      out.push(n);
    }
  }
  return out;
}

// Tanlangan rangdagi birinchi rasm (bo'lmasa — birinchi rasm)
function imageForColor(product, colorName) {
  const imgs = product.images || [];
  const cols = Array.isArray(product.imageColors) ? product.imageColors : [];
  if (colorName) {
    const i = cols.findIndex((c) => c && c.name && c.name.toLowerCase() === colorName.toLowerCase());
    if (i >= 0 && imgs[i]) return imgs[i];
  }
  return imgs[0] || null;
}

module.exports = { PRESET_COLORS, normalizeColor, productColors, imageForColor };
