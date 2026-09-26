// Rasm joylashuvi (zoom, x, y) -> CSS. Mini App'dagi bilan bir xil
export const DEFAULT_FRAME = { zoom: 1, x: 50, y: 50 };

export function frameStyle(frame) {
  const f = { ...DEFAULT_FRAME, ...(frame || {}) };
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transform: f.zoom !== 1 ? `scale(${f.zoom})` : undefined,
    transformOrigin: `${f.x}% ${f.y}%`,
  };
}
