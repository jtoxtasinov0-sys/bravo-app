// Foydalanuvchi: Telegram ma'lumotidan yaratish/yangilash
const prisma = require('../database/connection');
const cfg = require('../config/default');

// tg — Telegram user obyekti: { id, first_name, last_name, username, language_code }
async function upsertFromTelegram(tg) {
  const telegramId = String(tg.id);
  const data = {
    firstName: tg.first_name || null,
    lastName: tg.last_name || null,
    username: tg.username || null,
  };
  return prisma.user.upsert({
    where: { telegramId },
    update: data,
    create: { telegramId, ...data, lang: tg.language_code === 'ru' ? 'ru' : 'uz' },
  });
}

// Admin: ADMIN_CHAT_IDS ro'yxatida yoki bazada isAdmin = true
async function isAdmin(telegramId) {
  const id = String(telegramId);
  if (cfg.adminChatIds.includes(id)) return true;
  const u = await prisma.user.findUnique({ where: { telegramId: id } });
  return !!(u && u.isAdmin);
}

// Xabar yuboriladigan barcha adminlar (env + baza)
async function adminChatIds() {
  const dbAdmins = await prisma.user.findMany({ where: { isAdmin: true }, select: { telegramId: true } });
  return [...new Set([...cfg.adminChatIds, ...dbAdmins.map((u) => u.telegramId)])];
}

module.exports = { upsertFromTelegram, isAdmin, adminChatIds };
