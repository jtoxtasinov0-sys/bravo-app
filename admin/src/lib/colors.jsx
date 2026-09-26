// Rang yordamchilari
export const isLight = (hex) => {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
};

export function ColorDot({ hex, size = 14 }) {
  return (
    <span
      className="dot"
      style={{ width: size, height: size, background: hex, boxShadow: isLight(hex) ? 'inset 0 0 0 1px #ccc' : 'none' }}
    />
  );
}

export const STATUS = {
  new: { label: 'Yangi', cls: 'st-blue' },
  confirmed: { label: 'Tasdiqlandi', cls: 'st-green' },
  delivered: { label: 'Yetkazildi', cls: 'st-gray' },
  cancelled: { label: 'Bekor qilindi', cls: 'st-red' },
};

export const PAY_STATUS = {
  unpaid: { label: "To'lanmagan", cls: 'st-gray' },
  pending: { label: 'Chek keldi — tekshiring', cls: 'st-orange' },
  paid: { label: "To'langan", cls: 'st-green' },
  rejected: { label: 'Rad etilgan', cls: 'st-red' },
};

export const PAY_METHOD = { cash: '💵 Naqd', click: '📲 Click', card: '💳 Karta' };
