// To'lov: karta ma'lumoti, Click havolasi, chek, Tasdiqlash / Rad etish
const prisma = require('../database/connection');
const cfg = require('../config/default');
const Setting = require('../models/Setting');
const { notifyAdminsPhoto, notifyCustomer } = require('../core/bot');
const { receiptCaption } = require('../utils/i18n');

// Mini App'ga ko'rsatiladigan to'lov ma'lumoti
async function paymentInfo(order) {
  const s = await Setting.getAll();
  const info = {
    method: order.paymentMethod,
    amount: order.total,
    card: s.cardNumber ? { number: s.cardNumber, holder: s.cardHolder, type: s.cardType } : null,
    clickUrl: null,
  };
  if (order.paymentMethod === 'click' && cfg.click.serviceId && cfg.click.merchantId) {
    const q = new URLSearchParams({
      service_id: cfg.click.serviceId,
      merchant_id: cfg.click.merchantId,
      amount: String(order.total),
      transaction_param: String(order.id),
    });
    if (cfg.miniappUrl) q.set('return_url', cfg.miniappUrl);
    info.clickUrl = `https://my.click.uz/services/pay?${q}`;
  }
  return info;
}

// Chek kelganda: buyurtmaga biriktirish va adminlarga tugmalar bilan yuborish
async function attachReceipt(orderId, receiptUrl) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { receiptUrl, receiptAt: new Date(), paymentStatus: 'pending' },
  });
  await notifyAdminsPhoto(receiptUrl, receiptCaption(order), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Tasdiqlash', callback_data: `pay:ok:${order.id}` },
          { text: '❌ Rad etish', callback_data: `pay:no:${order.id}` },
        ],
      ],
    },
  });
  return order;
}

// Admin tasdiqladi / rad etdi — mijozga avtomatik xabar
async function setPaymentStatus(orderId, status) {
  if (!['unpaid', 'pending', 'paid', 'rejected'].includes(status)) throw new Error('Noto\'g\'ri holat');
  const before = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!before) return null;
  const order = await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: status } });
  if (before.paymentStatus !== status) {
    const lang = before.user?.lang || 'uz';
    if (status === 'paid') await notifyCustomer(order.telegramId, lang, 'payOk', order.id);
    if (status === 'rejected') await notifyCustomer(order.telegramId, lang, 'payNo', order.id);
  }
  return order;
}

module.exports = { paymentInfo, attachReceipt, setPaymentStatus };
