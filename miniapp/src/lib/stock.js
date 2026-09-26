// Ombor qoldig'i (null = cheklov yo'q)

export const sizeLeft = (p, size) => {
  if (!p.stockPairs) return Infinity;
  return Number(p.stockPairs[size] ?? 0);
};

export const isAvailable = (p) => {
  if (p.soldOut) return false;
  if (!p.stockPairs) return true;
  return (p.sizes || []).some((s) => sizeLeft(p, s) > 0);
};
