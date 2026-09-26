// Admin rasmga bergan joylashuv (zoom, x, y) -> CSS uslubi
export function frameStyle(frame) {
  const f = frame || {};
  const zoom = Number(f.zoom) || 1;
  const x = f.x ?? 50;
  const y = f.y ?? 50;
  return {
    objectPosition: `${x}% ${y}%`,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${x}% ${y}%`,
  };
}
