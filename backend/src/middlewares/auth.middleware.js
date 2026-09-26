// Himoya: Telegram initData (HMAC) tekshiruvi va admin JWT
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cfg = require('../config/default');
const prisma = require('../database/connection');
const User = require('../models/User');

// Telegram Mini App yuborgan initData haqiqiyligini tekshiradi.
// To'g'ri bo'lsa — Telegram user obyektini qaytaradi, aks holda null
function verifyInitData(initData) {
  if (!initData || !cfg.botToken) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');
    const dataCheck = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    const secret = crypto.createHmac('sha256', 'WebAppData').update(cfg.botToken).digest();
    const calc = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
    if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
    // 7 kundan eski ma'lumot qabul qilinmaydi
    const authDate = Number(params.get('auth_date') || 0);
    if (Date.now() / 1000 - authDate > 7 * 24 * 3600) return null;
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

// Mijoz so'rovlari uchun. Brauzerda (Telegram tashqarisida, production emas) — "Demo Mijoz"
async function clientAuth(req, res, next) {
  try {
    const tgUser = verifyInitData(req.get('X-Telegram-Init-Data'));
    if (tgUser && tgUser.id) {
      req.user = await User.upsertFromTelegram(tgUser);
      return next();
    }
    if (!cfg.isProd) {
      req.user = await prisma.user.upsert({
        where: { telegramId: 'demo' },
        update: {},
        create: { telegramId: 'demo', firstName: 'Demo Mijoz' },
      });
      req.isDemo = true;
      return next();
    }
    return res.status(401).json({ error: 'Mini App faqat Telegram ichida ishlaydi' });
  } catch (e) {
    next(e);
  }
}

// Ixtiyoriy: foydalanuvchi bo'lsa aniqlaydi, bo'lmasa ham o'tkazadi
async function optionalClient(req, _res, next) {
  const tgUser = verifyInitData(req.get('X-Telegram-Init-Data'));
  if (tgUser && tgUser.id) req.user = await User.upsertFromTelegram(tgUser).catch(() => null);
  next();
}

const signAdmin = (payload) => jwt.sign(payload, cfg.jwtSecret, { expiresIn: '30d' });

function adminAuth(req, res, next) {
  const token = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  try {
    req.admin = jwt.verify(token, cfg.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Qayta kiring' });
  }
}

module.exports = { verifyInitData, clientAuth, optionalClient, adminAuth, signAdmin };
