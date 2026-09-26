// Telegram bot: yaratish, webhook/polling, xavfsiz yuborish, adminlarga xabar
process.env.NTBA_FIX_350 = '1'; // node-telegram-bot-api fayl yuborish ogohlantirishini o'chirish

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const cfg = require('../config/default');
const User = require('../models/User');
const { diskPath } = require('../utils/upload');
const { t, itemCaption, orderSummary } = require('../utils/i18n');

let bot = null;
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Webhook yo'li token'dan yasaladi (token URL'da ochiq ko'rinmasin)
const webhookPath = () => `/tg/webhook/${hash(cfg.botToken).slice(0, 32)}`;
const webhookSecret = () => hash('secret:' + cfg.botToken).slice(0, 48);

const isHttps = (u) => /^https:\/\//i.test(u || '');

function getBot() {
  return bot;
}

// Bot'ni yaratish. BOT_TOKEN bo'lmasa — server botsiz ishlayveradi
function createBot() {
  if (!cfg.botToken) {
    console.warn('⚠️  BOT_TOKEN yo\'q — bot ishga tushmadi (API va saytlar ishlayveradi).');
    return null;
  }
  bot = new TelegramBot(cfg.botToken, { polling: false });
  bot.on('polling_error', (e) => console.error('Bot polling xatosi:', e.code, e.message));
  bot.on('webhook_error', (e) => console.error('Bot webhook xatosi:', e.message));
  return bot;
}

// https bo'lsa — webhook, aks holda — polling
async function startBot(app) {
  if (!bot) return;
  if (isHttps(cfg.publicUrl)) {
    const p = webhookPath();
    app.post(p, (req, res) => {
      if (req.get('X-Telegram-Bot-Api-Secret-Token') !== webhookSecret()) return res.sendStatus(401);
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    const url = cfg.publicUrl.replace(/\/$/, '') + p;
    await bot.setWebHook(url, { secret_token: webhookSecret(), drop_pending_updates: false });
    console.log('🤖 Bot webhook rejimida:', cfg.publicUrl);
  } else {
    await bot.deleteWebHook().catch(() => {});
    await bot.startPolling();
    console.log('🤖 Bot polling rejimida (lokal)');
  }
  try {
    const me = await bot.getMe();
    console.log(`🤖 Bot: @${me.username}`);
  } catch (e) {
    console.error('❌ BOT_TOKEN noto\'g\'ri bo\'lishi mumkin:', e.message);
  }
  await setDefaultMenuButton();
}

// Pastki "Menu" tugmasi: mijozlarga Mini App
async function setDefaultMenuButton() {
  if (!bot || !isHttps(cfg.miniappUrl)) return;
  try {
    await bot.setChatMenuButton({
      menu_button: JSON.stringify({ type: 'web_app', text: "Do'kon", web_app: { url: cfg.miniappUrl } }),
    });
  } catch (e) {
    console.error('Menu tugmasini o\'rnatib bo\'lmadi:', e.message);
  }
}

// Adminlarga: Menu tugmasi Admin panelni ochadi
async function setAdminMenuButton(chatId) {
  if (!bot || !isHttps(cfg.adminUrl)) return;
  try {
    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: JSON.stringify({ type: 'web_app', text: 'Admin', web_app: { url: cfg.adminUrl } }),
    });
  } catch (e) {
    /* guruhlarda ishlamaydi — e'tibor bermaymiz */
  }
}

// Xato bo'lsa ham server yiqilmasin
async function safeSend(chatId, text, opts = {}) {
  if (!bot || !chatId) return null;
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'HTML', disable_web_page_preview: true, ...opts });
  } catch (e) {
    console.error(`Xabar yuborilmadi (${chatId}):`, e.message);
    return null;
  }
}

// Rasm yuborish: "/uploads/..." — diskdan, "http..." — havola
async function safePhoto(chatId, imageUrl, caption, opts = {}) {
  if (!bot || !chatId) return null;
  try {
    const disk = diskPath(imageUrl);
    let photo = null;
    if (disk) photo = fs.createReadStream(disk);
    else if (/^https?:\/\//.test(imageUrl || '')) photo = imageUrl;
    if (!photo) return safeSend(chatId, caption, opts);
    return await bot.sendPhoto(chatId, photo, { caption, parse_mode: 'HTML', ...opts }, { filename: path.basename(disk || 'photo.jpg'), contentType: 'image/jpeg' });
  } catch (e) {
    console.error(`Rasm yuborilmadi (${chatId}):`, e.message);
    return safeSend(chatId, caption, opts); // rasm bo'lmasa — matn
  }
}

async function notifyAdmins(text, opts = {}) {
  const ids = await User.adminChatIds();
  if (!ids.length) console.warn('⚠️  Adminlar yo\'q: ADMIN_CHAT_IDS ni to\'ldiring yoki botda /admin PAROL yozing.');
  for (const id of ids) await safeSend(id, text, opts);
}

async function notifyAdminsPhoto(imageUrl, caption, opts = {}) {
  const ids = await User.adminChatIds();
  for (const id of ids) await safePhoto(id, imageUrl, caption, opts);
}

// Yangi buyurtma: avval har bir mahsulot rasmi, keyin umumiy xabar
async function sendNewOrder(order) {
  const ids = await User.adminChatIds();
  for (const id of ids) {
    for (const it of order.items || []) await safePhoto(id, it.image, itemCaption(order, it));
    await safeSend(id, orderSummary(order));
  }
}

// Mijozga xabar (uning tilida)
async function notifyCustomer(telegramId, lang, key, ...args) {
  if (!telegramId || !/^\d+$/.test(String(telegramId))) return;
  const T = t(lang);
  const fn = key.split('.').reduce((o, k) => (o ? o[k] : null), T);
  if (typeof fn === 'function') await safeSend(telegramId, fn(...args));
}

module.exports = {
  getBot,
  createBot,
  startBot,
  isHttps,
  safeSend,
  safePhoto,
  notifyAdmins,
  notifyAdminsPhoto,
  sendNewOrder,
  notifyCustomer,
  setAdminMenuButton,
};
