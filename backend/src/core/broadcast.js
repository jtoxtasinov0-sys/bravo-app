// Rassilka: barcha foydalanuvchilarga xabar (soniyasiga ~20 ta — Telegram cheklovi ~30)
const prisma = require('../database/connection');
const User = require('../models/User');
const { safeSend, safePhoto, getBot } = require('./bot');

const state = { running: false, total: 0, sent: 0, failed: 0, test: false, startedAt: null, finishedAt: null };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function status() {
  return { ...state };
}

// test = true — faqat adminlarga (sinov)
async function start({ text, image, test }) {
  if (!getBot()) throw new Error('Bot ishlamayapti (BOT_TOKEN yo\'q)');
  if (state.running) throw new Error('Rassilka allaqachon ketmoqda');
  const ids = test
    ? await User.adminChatIds()
    : (await prisma.user.findMany({ select: { telegramId: true } })).map((u) => u.telegramId).filter((id) => /^\d+$/.test(id));

  Object.assign(state, { running: true, total: ids.length, sent: 0, failed: 0, test: !!test, startedAt: new Date(), finishedAt: null });

  // Fonda yuboramiz — admin panel kutib qolmasin
  (async () => {
    for (const id of ids) {
      const r = image ? await safePhoto(id, image, text) : await safeSend(id, text);
      if (r) state.sent++;
      else state.failed++;
      await sleep(50);
    }
    state.running = false;
    state.finishedAt = new Date();
  })();

  return status();
}

module.exports = { start, status };
