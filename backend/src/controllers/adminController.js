// Admin panel API
const crypto = require('crypto');
const prisma = require('../database/connection');
const cfg = require('../config/default');
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const payment = require('../services/payment');
const broadcast = require('../core/broadcast');
const { signAdmin, verifyInitData } = require('../middlewares/auth.middleware');
const { publicPath } = require('../utils/upload');
const { PRESET_COLORS } = require('../utils/colors');
const { esc } = require('../utils/i18n');

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ---------- Kirish ----------
async function login(req, res) {
  const { username, password } = req.body || {};
  if (safeEqual(username || '', cfg.adminUsername) && safeEqual(password || '', cfg.adminPassword)) {
    return res.json({ token: signAdmin({ by: 'password', username }) });
  }
  res.status(401).json({ error: "Login yoki parol noto'g'ri" });
}

// Telegram ichidan ochilsa — parolsiz (admin ekanligi tekshiriladi)
async function loginTelegram(req, res) {
  const tg = verifyInitData(req.body && req.body.initData);
  if (!tg) return res.status(401).json({ error: 'Telegram ma\'lumoti noto\'g\'ri' });
  if (!(await User.isAdmin(tg.id))) return res.status(403).json({ error: 'Siz admin emassiz. Botda /admin PAROL yozing.' });
  res.json({ token: signAdmin({ by: 'telegram', telegramId: String(tg.id), name: tg.first_name }) });
}

async function meta(_req, res) {
  res.json({
    company: cfg.company,
    categories: cfg.categories,
    tags: cfg.tags,
    units: cfg.units,
    presetColors: PRESET_COLORS,
  });
}

// ---------- Statistika va buyurtmalar ----------
async function stats(_req, res) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [all, today, byStatus, sumAll, sumToday, pendingPay, users, products] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: start } } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'cancelled' } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'cancelled' }, createdAt: { gte: start } } }),
    prisma.order.count({ where: { paymentStatus: 'pending' } }),
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
  ]);
  res.json({
    orders: all,
    ordersToday: today,
    revenue: sumAll._sum.total || 0,
    revenueToday: sumToday._sum.total || 0,
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    pendingPayments: pendingPay,
    users,
    products,
  });
}

async function listOrders(req, res) {
  const { status, paymentStatus, q } = req.query;
  const where = {};
  if (status) where.status = String(status);
  if (paymentStatus) where.paymentStatus = String(paymentStatus);
  if (q) {
    const s = String(q).trim();
    where.OR = [
      { customerName: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s } },
      ...(/^\d+$/.test(s) ? [{ id: Number(s) }] : []),
    ];
  }
  const orders = await prisma.order.findMany({ where, orderBy: { id: 'desc' }, take: 300 });
  res.json(orders);
}

async function updateOrder(req, res) {
  const id = Number(req.params.id);
  const { status, paymentStatus } = req.body || {};
  let order = null;
  if (status) order = await Order.setStatus(id, status);
  if (paymentStatus) order = await payment.setPaymentStatus(id, paymentStatus);
  if (!order) return res.status(404).json({ error: 'Topilmadi' });
  res.json(order);
}

async function deleteOrder(req, res) {
  await prisma.order.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
}

// Hammasini tozalash — raqamlash #1 dan boshlanadi
async function clearOrders(req, res) {
  if ((req.body || {}).confirm !== 'TOZALASH') return res.status(400).json({ error: 'Tasdiqlash uchun TOZALASH deb yozing' });
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Order" RESTART IDENTITY');
  res.json({ ok: true });
}

// ---------- Mahsulotlar ----------
async function listProducts(_req, res) {
  res.json(await prisma.product.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }));
}

function validateProduct(d) {
  if (!d.article) return 'Artikul kiriting';
  if (!d.name) return 'Nomini kiriting';
  if (!cfg.categories.some((c) => c.key === d.category)) return 'Kategoriyani tanlang';
  if (!d.price) return 'Narxni kiriting';
  return null;
}

async function createProduct(req, res) {
  const d = Product.sanitize(req.body);
  const err = validateProduct(d);
  if (err) return res.status(400).json({ error: err });
  try {
    res.json(await prisma.product.create({ data: d }));
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Bu artikul band' });
    throw e;
  }
}

async function updateProduct(req, res) {
  const d = Product.sanitize(req.body);
  const err = validateProduct(d);
  if (err) return res.status(400).json({ error: err });
  try {
    res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data: d }));
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Bu artikul band' });
    throw e;
  }
}

async function deleteProduct(req, res) {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
}

// Ombor: razmer bo'yicha qoldiqlar
async function updateStock(req, res) {
  const b = req.body || {};
  const data = {};
  if ('stockPairs' in b) {
    if (b.stockPairs === null) data.stockPairs = null;
    else {
      const pairs = {};
      for (const [k, v] of Object.entries(b.stockPairs || {})) pairs[String(k)] = Math.max(0, Math.floor(Number(v) || 0));
      data.stockPairs = pairs;
    }
  }
  if ('inStock' in b) data.inStock = !!b.inStock;
  // Prisma'da Json maydonni null qilish uchun maxsus qiymat kerak
  if (data.stockPairs === null) data.stockPairs = require('@prisma/client').Prisma.DbNull;
  res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data }));
}

// ---------- Rasm yuklash ----------
function uploaded(folder) {
  return (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Rasm tanlanmagan' });
    res.json({ url: publicPath(folder, req.file.filename) });
  };
}

// ---------- Storylar ----------
async function listStories(_req, res) {
  res.json(await prisma.story.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }] }));
}

function storyData(b) {
  return {
    title: String(b.title || '').slice(0, 100),
    titleRu: b.titleRu ? String(b.titleRu).slice(0, 100) : null,
    image: String(b.image || ''),
    productId: b.productId ? Number(b.productId) : null,
    isActive: b.isActive !== false,
    sortOrder: Number(b.sortOrder) || 0,
  };
}

async function createStory(req, res) {
  const d = storyData(req.body || {});
  if (!d.image || !d.title) return res.status(400).json({ error: 'Rasm va sarlavha kerak' });
  res.json(await prisma.story.create({ data: d }));
}

async function updateStory(req, res) {
  res.json(await prisma.story.update({ where: { id: Number(req.params.id) }, data: storyData(req.body || {}) }));
}

async function deleteStory(req, res) {
  await prisma.story.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
}

// ---------- Mijozlar ----------
async function listUsers(_req, res) {
  const users = await prisma.user.findMany({
    orderBy: { id: 'desc' },
    take: 1000,
    include: { _count: { select: { orders: true } } },
  });
  res.json(users);
}

// ---------- Rassilka ----------
async function startBroadcast(req, res) {
  const { text, image, test } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: 'Matn yozing' });
  try {
    res.json(await broadcast.start({ text: esc(String(text).slice(0, 3500)), image: image || null, test: !!test }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function broadcastStatus(_req, res) {
  res.json(broadcast.status());
}

// ---------- Sozlamalar ----------
async function getSettings(_req, res) {
  res.json(await Setting.getAll());
}

async function updateSettings(req, res) {
  res.json(await Setting.setMany(req.body));
}

module.exports = {
  login,
  loginTelegram,
  meta,
  stats,
  listOrders,
  updateOrder,
  deleteOrder,
  clearOrders,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  uploaded,
  listStories,
  createStory,
  updateStory,
  deleteStory,
  listUsers,
  startBroadcast,
  broadcastStatus,
  getSettings,
  updateSettings,
};
