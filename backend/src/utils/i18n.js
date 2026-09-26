// Bot matnlari (uz / ru) va adminga boradigan xabar shablonlari
const cfg = require('../config/default');

// Mijoz yozgan matn HTML xabarni buzmasligi uchun
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const money = (n) => `${Number(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;

const T = {
  uz: {
    welcome: (name) =>
      `Assalomu alaykum, <b>${esc(name)}</b>! 👋\n\n<b>${cfg.company.name}</b> — ${esc(cfg.company.about).toLowerCase()}.\n<i>${esc(cfg.company.slogan)}</i>\n\nKatalogni ko'rish va buyurtma berish uchun pastdagi tugmani bosing 👇`,
    openShop: "🛍 Do'konni ochish",
    openAdmin: '⚙️ Admin panel',
    shareContact: '📱 Telefon raqamni yuborish',
    noHttps:
      "⚠️ Mini App manzili (MINIAPP_URL) hali https emas. Telegram faqat https manzilni ochadi — README'dagi ngrok bo'limini bajaring.",
    langChosen: "✅ Til: O'zbekcha",
    phoneSaved: '✅ Telefon raqamingiz saqlandi.',
    yourId: (id) => `🆔 Chat ID: <code>${id}</code>`,
    adminOk: "✅ Siz endi adminsiz. Yangi buyurtmalar shu yerga keladi.\n/start bosing — «Admin panel» tugmasi chiqadi.",
    adminBad: "❌ Parol noto'g'ri.",
    adminLimit: "⛔ Juda ko'p urinish. 1 soatdan keyin qayta urining.",
    adminUsage: 'Foydalanish: <code>/admin PAROL</code>',
    receiptSaved: (id) => `✅ Chek qabul qilindi (buyurtma #${id}). Admin tekshirib, tez orada javob beradi.`,
    receiptNoOrder: "Sizda to'lov kutilayotgan buyurtma topilmadi. Avval Mini App orqali buyurtma bering.",
    orderAccepted: (id) => `✅ Buyurtmangiz #${id} qabul qilindi! Tez orada operator siz bilan bog'lanadi.`,
    payOk: (id) => `✅ Buyurtma #${id} bo'yicha to'lovingiz tasdiqlandi. Rahmat!`,
    payNo: (id) =>
      `❌ Buyurtma #${id} bo'yicha chek rad etildi. Iltimos, to'g'ri chekni qayta yuboring yoki biz bilan bog'laning: ${cfg.company.phone}`,
    status: {
      confirmed: (id) => `✅ Buyurtma #${id} tasdiqlandi. Tez orada yuboriladi.`,
      delivered: (id) => `📦 Buyurtma #${id} yetkazildi. Xaridingiz uchun rahmat!`,
      cancelled: (id) => `❌ Buyurtma #${id} bekor qilindi. Savollar bo'lsa: ${cfg.company.phone}`,
    },
  },
  ru: {
    welcome: (name) =>
      `Здравствуйте, <b>${esc(name)}</b>! 👋\n\n<b>${cfg.company.name}</b> — ${esc(cfg.company.aboutRu).toLowerCase()}.\n<i>${esc(cfg.company.sloganRu)}</i>\n\nНажмите кнопку ниже, чтобы открыть каталог и оформить заказ 👇`,
    openShop: '🛍 Открыть магазин',
    openAdmin: '⚙️ Админ-панель',
    shareContact: '📱 Отправить номер',
    noHttps: '⚠️ Адрес Mini App (MINIAPP_URL) ещё не https. Telegram открывает только https — см. раздел ngrok в README.',
    langChosen: '✅ Язык: Русский',
    phoneSaved: '✅ Ваш номер сохранён.',
    yourId: (id) => `🆔 Chat ID: <code>${id}</code>`,
    adminOk: '✅ Теперь вы администратор. Новые заказы будут приходить сюда.\nНажмите /start — появится кнопка «Админ-панель».',
    adminBad: '❌ Неверный пароль.',
    adminLimit: '⛔ Слишком много попыток. Попробуйте через час.',
    adminUsage: 'Использование: <code>/admin ПАРОЛЬ</code>',
    receiptSaved: (id) => `✅ Чек получен (заказ #${id}). Администратор проверит и скоро ответит.`,
    receiptNoOrder: 'У вас нет заказа, ожидающего оплаты. Сначала оформите заказ в Mini App.',
    orderAccepted: (id) => `✅ Ваш заказ #${id} принят! Оператор скоро свяжется с вами.`,
    payOk: (id) => `✅ Оплата по заказу #${id} подтверждена. Спасибо!`,
    payNo: (id) => `❌ Чек по заказу #${id} отклонён. Отправьте правильный чек или свяжитесь с нами: ${cfg.company.phone}`,
    status: {
      confirmed: (id) => `✅ Заказ #${id} подтверждён. Скоро отправим.`,
      delivered: (id) => `📦 Заказ #${id} доставлен. Спасибо за покупку!`,
      cancelled: (id) => `❌ Заказ #${id} отменён. Вопросы: ${cfg.company.phone}`,
    },
  },
};

const t = (lang) => T[lang === 'ru' ? 'ru' : 'uz'];

const PAY_METHOD = { cash: '💵 Naqd', click: '📲 Click', card: "💳 Kartaga o'tkazma" };
const PAY_STATUS = {
  unpaid: "⏳ hali to'lanmadi",
  pending: '🧾 chek yuborildi — tekshiring',
  paid: '✅ tasdiqlangan',
  rejected: '❌ rad etilgan',
};

// Bitta mahsulot qatori (rasm ostidagi yozuv va umumiy ro'yxat uchun)
function itemLine(it) {
  const color = it.color ? esc(it.color) : '<i>belgilanmagan</i>';
  const what = Object.entries(it.sizeQty || {})
    .filter(([, q]) => q > 0)
    .map(([s, q]) => `${esc(s)}×${q}`)
    .join(', ');
  return { color, what };
}

function itemCaption(order, it) {
  const { color, what } = itemLine(it);
  return [
    `🛒 Buyurtma #${order.id}`,
    `<b>${esc(it.name)}</b>`,
    `Artikul: <code>${esc(it.article)}</code>`,
    `🎨 Rang: ${color}`,
    `📐 ${what}`,
    `${it.qty} × ${money(it.unitPrice)} = <b>${money(it.lineTotal)}</b>`,
  ].join('\n');
}

function orderSummary(order) {
  const lines = (order.items || []).map((it, i) => {
    const { color, what } = itemLine(it);
    return `${i + 1}. <b>${esc(it.name)}</b> (${esc(it.article)}) — ${color}\n    ${what} → ${it.qty} × ${money(it.unitPrice)} = ${money(it.lineTotal)}`;
  });
  const tg = order.telegramId && /^\d+$/.test(order.telegramId)
    ? `<a href="tg://user?id=${order.telegramId}">Telegramda yozish</a>`
    : '—';
  return [
    `🆕 <b>Yangi buyurtma #${order.id}</b>`,
    '',
    ...lines,
    '',
    `📦 Jami: ${order.totalQty} ta`,
    `💰 Summa: <b>${money(order.total)}</b>`,
    `💳 To'lov: ${PAY_METHOD[order.paymentMethod] || order.paymentMethod}`,
    `📌 To'lov holati: ${PAY_STATUS[order.paymentStatus] || order.paymentStatus}`,
    '',
    `👤 ${esc(order.customerName)}`,
    `📞 ${esc(order.phone)}`,
    `📍 ${esc(order.region)}, ${esc(order.address)}`,
    order.comment ? `💬 ${esc(order.comment)}` : null,
    `🔗 ${tg}`,
  ]
    .filter((x) => x !== null)
    .join('\n');
}

function receiptCaption(order) {
  return [
    `🧾 <b>Chek keldi — buyurtma #${order.id}</b>`,
    `💰 Summa: <b>${money(order.total)}</b>`,
    `💳 ${PAY_METHOD[order.paymentMethod] || order.paymentMethod}`,
    `👤 ${esc(order.customerName)} · ${esc(order.phone)}`,
    `📌 Holat: ${PAY_STATUS[order.paymentStatus] || order.paymentStatus}`,
  ].join('\n');
}

module.exports = { t, esc, money, itemCaption, orderSummary, receiptCaption, PAY_METHOD, PAY_STATUS };
