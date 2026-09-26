// Mijoz (Mini App) API: sozlamalar, mahsulotlar, savatcha, buyurtma, chek
const prisma = require('../database/connection');
const cfg = require('../config/default');
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Order = require('../models/Order');
const pricing = require('../services/pricing');
const payment = require('../services/payment');
const { StockError } = require('../services/stock');
const { sendNewOrder, notifyCustomer } = require('../core/bot');
const { publicPath } = require('../utils/upload');

const userView = (u) => ({
  id: u.id,
  telegramId: u.telegramId,
  firstName: u.firstName,
  lastName: u.lastName,
  username: u.username,
  phone: u.phone,
  lang: u.lang,
  seenIntro: u.seenIntro,
});

// Do'kon sozlamalari (brend, kategoriyalar, viloyatlar, to'lov usullari)
async function getConfig(_req, res) {
  const s = await Setting.getAll();
  res.json({
    company: cfg.company,
    botUsername: cfg.botUsername,
    categories: cfg.categories,
    tags: cfg.tags,
    units: cfg.units,
    regions: cfg.regions,
    retailEnabled: s.retailEnabled !== 'false',
    wholesaleEnabled: s.wholesaleEnabled !== 'false',
    payments: {
      cash: true,
      // Click merchant ulanmagan bo'lsa ham ko'rinadi — karta + chek jarayoni ishlaydi (karta bo'lsa)
      click: !!(cfg.click.serviceId && cfg.click.merchantId) || !!s.cardNumber,
      card: !!s.cardNumber,
    },
  });
}

async function getMe(req, res) {
  res.json({ user: userView(req.user), demo: !!req.isDemo });
}

async function updateMe(req, res) {
  const b = req.body || {};
  const data = {};
  if (b.lang === 'uz' || b.lang === 'ru') data.lang = b.lang;
  if (typeof b.seenIntro === 'boolean') data.seenIntro = b.seenIntro;
  if (typeof b.phone === 'string') data.phone = b.phone.slice(0, 30);
  if (typeof b.firstName === 'string') data.firstName = b.firstName.slice(0, 60);
  const u = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: userView(u) });
}

async function listProducts(_req, res) {
  const items = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  res.json(items.map(Product.toPublic));
}

async function getProduct(req, res) {
  const p = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  if (!p || !p.isActive) return res.status(404).json({ error: 'Topilmadi' });
  res.json(Product.toPublic(p));
}

async function listStories(_req, res) {
  const items = await prisma.story.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
  });
  res.json(items);
}

async function calculate(req, res) {
  const r = await pricing.calculate(req.body.items, req.user?.lang);
  res.json(r);
}

const clean = (v, max = 300) => String(v ?? '').trim().slice(0, max);

async function createOrder(req, res) {
  const b = req.body || {};
  const lang = req.user.lang;
  const ru = lang === 'ru';
  const calc = await pricing.calculate(b.items, lang);
  if (!calc.lines.length) return res.status(400).json({ error: ru ? 'Корзина пуста' : "Savatcha bo'sh" });
  if (calc.errors.length) return res.status(400).json({ error: calc.errors.join('\n') });

  const c = b.customer || {};
  const data = {
    customerName: clean(c.name, 80),
    phone: clean(c.phone, 30),
    region: clean(c.region, 80),
    address: clean(c.address, 300),
    comment: clean(c.comment, 500) || null,
    paymentMethod: ['cash', 'click', 'card'].includes(b.paymentMethod) ? b.paymentMethod : 'cash',
  };
  if (!data.customerName || data.phone.replace(/\D/g, '').length < 9 || !data.address) {
    return res.status(400).json({ error: ru ? 'Заполните имя, телефон и адрес' : "Ism, telefon va manzilni to'ldiring" });
  }
  // Yetkazib berish faqat ro'yxatdagi viloyatlarga
  if (!cfg.regions.some((r) => r.uz === data.region || r.ru === data.region)) {
    return res.status(400).json({ error: ru ? 'Выберите область' : 'Viloyatni tanlang' });
  }
  const s = await Setting.getAll();
  if (data.paymentMethod === 'card' && !s.cardNumber) data.paymentMethod = 'cash';

  let order;
  try {
    order = await Order.create(calc, data, req.user, lang);
  } catch (e) {
    if (e instanceof StockError) return res.status(409).json({ error: e.message });
    throw e;
  }

  // Telefonni profilga ham saqlaymiz
  if (!req.user.phone) await prisma.user.update({ where: { id: req.user.id }, data: { phone: data.phone } }).catch(() => {});

  // Adminlarga va mijozga xabar (javobni kutdirmaymiz)
  sendNewOrder(order).catch((e) => console.error(e));
  notifyCustomer(order.telegramId, lang, 'orderAccepted', order.id).catch(() => {});

  res.json({ order, payment: await payment.paymentInfo(order) });
}

async function myOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { id: 'desc' },
    take: 50,
  });
  res.json(orders);
}

async function orderPayment(req, res) {
  const order = await prisma.order.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
  if (!order) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ order, payment: await payment.paymentInfo(order) });
}

// Mini App'dan chek rasmi yuklash
async function uploadReceipt(req, res) {
  const order = await prisma.order.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
  if (!order) return res.status(404).json({ error: 'Topilmadi' });
  if (!req.file) return res.status(400).json({ error: 'Rasm tanlanmagan' });
  const updated = await payment.attachReceipt(order.id, publicPath('receipts', req.file.filename));
  res.json({ order: updated });
}

module.exports = {
  getConfig,
  getMe,
  updateMe,
  listProducts,
  getProduct,
  listStories,
  calculate,
  createOrder,
  myOrders,
  orderPayment,
  uploadReceipt,
};
