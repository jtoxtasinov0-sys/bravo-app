// Telegram bot buyruqlari va tugmalari
const prisma = require('../database/connection');
const cfg = require('../config/default');
const User = require('../models/User');
const payment = require('../services/payment');
const { safeSend, isHttps, setAdminMenuButton } = require('../core/bot');
const { saveBuffer } = require('../utils/upload');
const { t, receiptCaption } = require('../utils/i18n');

// /admin PAROL — 1 soatda 5 ta xato urinish chegarasi
const attempts = new Map();
function tooMany(chatId) {
  const now = Date.now();
  const list = (attempts.get(chatId) || []).filter((ts) => now - ts < 3600_000);
  attempts.set(chatId, list);
  return list.length >= 5;
}

function register(bot) {
  // Asosiy menyu: Mini App tugmasi (+ adminlarga Admin panel)
  async function sendStart(msg) {
    const chatId = msg.chat.id;
    const user = msg.from ? await User.upsertFromTelegram(msg.from) : null;
    const lang = user?.lang || 'uz';
    const T = t(lang);
    const admin = msg.from && (await User.isAdmin(msg.from.id));

    const inline = [];
    if (isHttps(cfg.miniappUrl)) inline.push([{ text: T.openShop, web_app: { url: cfg.miniappUrl } }]);
    if (admin && isHttps(cfg.adminUrl)) inline.push([{ text: T.openAdmin, web_app: { url: cfg.adminUrl } }]);
    inline.push([
      { text: "🇺🇿 O'zbekcha", callback_data: 'lang:uz' },
      { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
    ]);

    await safeSend(chatId, T.welcome(msg.from?.first_name || ''), { reply_markup: { inline_keyboard: inline } });
    if (!isHttps(cfg.miniappUrl)) await safeSend(chatId, T.noHttps);

    // Telefon so'rash (faqat shaxsiy chatda va telefon hali yo'q bo'lsa)
    if (msg.chat.type === 'private' && user && !user.phone) {
      await safeSend(chatId, '📱', {
        reply_markup: {
          keyboard: [[{ text: T.shareContact, request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
    if (admin && msg.chat.type === 'private') await setAdminMenuButton(chatId);
  }

  bot.onText(/^\/(start|help)\b/, sendStart);

  // /id — chat ID ni ko'rsatadi (guruhda ham)
  bot.onText(/^\/id\b/, (msg) => safeSend(msg.chat.id, t('uz').yourId(msg.chat.id)));

  // /admin PAROL
  bot.onText(/^\/admin(?:@\w+)?(?:\s+(.+))?$/, async (msg, m) => {
    const chatId = msg.chat.id;
    const user = await User.upsertFromTelegram(msg.from);
    const T = t(user.lang);
    const pass = (m[1] || '').trim();
    // Parolli xabarni o'chiramiz (boshqalar ko'rmasin)
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    if (!pass) return safeSend(chatId, T.adminUsage);
    if (tooMany(chatId)) return safeSend(chatId, T.adminLimit);
    if (pass !== cfg.adminPassword) {
      attempts.get(chatId).push(Date.now());
      return safeSend(chatId, T.adminBad);
    }
    await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
    await safeSend(chatId, T.adminOk);
    await setAdminMenuButton(chatId);
  });

  // Kontakt — telefonni profilga saqlash
  bot.on('contact', async (msg) => {
    if (!msg.contact || msg.contact.user_id !== msg.from.id) return;
    const user = await User.upsertFromTelegram(msg.from);
    await prisma.user.update({ where: { id: user.id }, data: { phone: msg.contact.phone_number } });
    await safeSend(msg.chat.id, t(user.lang).phoneSaved, { reply_markup: { remove_keyboard: true } });
  });

  // Chek rasmi — oxirgi to'lanmagan (karta/click) buyurtmaga biriktiriladi
  bot.on('photo', async (msg) => {
    if (msg.chat.type !== 'private') return;
    const user = await User.upsertFromTelegram(msg.from);
    const T = t(user.lang);
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        paymentMethod: { in: ['card', 'click'] },
        paymentStatus: { in: ['unpaid', 'rejected'] },
        status: { not: 'cancelled' },
      },
      orderBy: { id: 'desc' },
    });
    if (!order) return safeSend(msg.chat.id, T.receiptNoOrder);
    try {
      const photo = msg.photo[msg.photo.length - 1];
      const link = await bot.getFileLink(photo.file_id);
      const buf = Buffer.from(await (await fetch(link)).arrayBuffer());
      const url = await saveBuffer('receipts', buf, '.jpg');
      await payment.attachReceipt(order.id, url);
      await safeSend(msg.chat.id, T.receiptSaved(order.id));
    } catch (e) {
      console.error('Chekni saqlab bo\'lmadi:', e.message);
    }
  });

  // Inline tugmalar
  bot.on('callback_query', async (q) => {
    const data = q.data || '';
    try {
      if (data.startsWith('lang:')) {
        const lang = data.slice(5) === 'ru' ? 'ru' : 'uz';
        const user = await User.upsertFromTelegram(q.from);
        await prisma.user.update({ where: { id: user.id }, data: { lang } });
        await bot.answerCallbackQuery(q.id, { text: t(lang).langChosen });
        return sendStart({ chat: q.message.chat, from: q.from });
      }

      const m = data.match(/^pay:(ok|no):(\d+)$/);
      if (m) {
        if (!(await User.isAdmin(q.from.id))) return bot.answerCallbackQuery(q.id, { text: 'Faqat admin uchun', show_alert: true });
        const order = await payment.setPaymentStatus(Number(m[2]), m[1] === 'ok' ? 'paid' : 'rejected');
        if (!order) return bot.answerCallbackQuery(q.id, { text: 'Buyurtma topilmadi', show_alert: true });
        await bot.answerCallbackQuery(q.id, { text: m[1] === 'ok' ? '✅ Tasdiqlandi' : '❌ Rad etildi' });
        // Xabardagi yozuvni yangilaymiz, tugmalarni olib tashlaymiz
        const opts = { chat_id: q.message.chat.id, message_id: q.message.message_id, parse_mode: 'HTML' };
        const text = receiptCaption(order) + `\n\n👮 ${q.from.first_name || 'Admin'}`;
        if (q.message.photo) await bot.editMessageCaption(text, opts).catch(() => {});
        else await bot.editMessageText(text, opts).catch(() => {});
        return;
      }
      await bot.answerCallbackQuery(q.id);
    } catch (e) {
      console.error('callback xatosi:', e.message);
      bot.answerCallbackQuery(q.id).catch(() => {});
    }
  });
}

module.exports = { register };
