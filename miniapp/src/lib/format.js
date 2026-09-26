// Narx va sana ko'rinishi
export const fmt = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/[ ,]/g, ' ');

export const money = (n, lang = 'uz') => `${fmt(n)} ${lang === 'ru' ? 'сум' : "so'm"}`;

export const date = (d, lang = 'uz') =>
  new Date(d).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Telefon: +998 XX XXX XX XX
export function formatPhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (!d.startsWith('998')) d = '998' + d.replace(/^998/, '');
  d = d.slice(0, 12);
  const p = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return '+' + p.join(' ');
}
