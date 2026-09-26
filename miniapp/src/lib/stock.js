// Ombor qoldig'i (null = cheklov yo'q)

export const packsLeft = (p) => (p.stockPacks === null || p.stockPacks === undefined ? Infinity : p.stockPacks);

export const sizeLeft = (p, size) => {
  if (!p.stockPairs) return Infinity;
  return Number(p.stockPairs[size] ?? 0);
};

export const wholesaleAvailable = (p) => !p.soldOut && packsLeft(p) > 0;

export const retailAvailable = (p) => {
  if (p.soldOut) return false;
  if (!p.stockPairs) return true;
  return (p.sizes || []).some((s) => sizeLeft(p, s) > 0);
};

export const availableIn = (p, mode) => (mode === 'wholesale' ? wholesaleAvailable(p) : retailAvailable(p));
