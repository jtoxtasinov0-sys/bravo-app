// Mahsulot ranglari va rangga mos rasmlar

// Tanlangan rangdagi rasmlar indekslari (rang belgilanmagan bo'lsa — hammasi)
export function imagesForColor(product, colorName) {
  const imgs = product.images || [];
  const cols = product.imageColors || [];
  if (!colorName) return imgs.map((_, i) => i);
  const idx = imgs.map((_, i) => i).filter((i) => cols[i] && cols[i].name === colorName);
  // Rangi belgilanmagan rasmlar ham ko'rinsin
  const neutral = imgs.map((_, i) => i).filter((i) => !cols[i]);
  const res = [...idx, ...neutral];
  return res.length ? res : imgs.map((_, i) => i);
}

export function firstImageForColor(product, colorName) {
  const i = imagesForColor(product, colorName)[0] ?? 0;
  return { url: product.images?.[i], frame: product.imageFrames?.[i] };
}

// Oq/och ranglarga chegara kerak
export const isLight = (hex) => {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
};
