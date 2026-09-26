// Buyurtma: yaratish (ombor bilan) va holatni o'zgartirish
const prisma = require('../database/connection');
const { takeStock, returnStock } = require('../services/stock');
const { notifyCustomer } = require('../core/bot');

const STATUSES = ['new', 'confirmed', 'delivered', 'cancelled'];

// calc — pricing.calculate() natijasi; data — mijoz ma'lumotlari
async function create(calc, data, user, lang) {
  return prisma.$transaction(async (tx) => {
    await takeStock(tx, calc.lines, lang);
    return tx.order.create({
      data: {
        userId: user ? user.id : null,
        telegramId: user ? user.telegramId : null,
        items: calc.lines,
        totalQty: calc.totalQty,
        total: calc.total,
        isWholesale: calc.isWholesale,
        ...data,
      },
    });
  });
}

// Holat o'zgarsa — mijozga xabar; bekor qilinsa — omborga qaytarish
async function setStatus(orderId, status) {
  if (!STATUSES.includes(status)) throw new Error('Noto\'g\'ri holat');
  const before = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!before) return null;
  if (before.status === status) return before;

  const order = await prisma.$transaction(async (tx) => {
    let stockReturned = before.stockReturned;
    if (status === 'cancelled' && !stockReturned) {
      await returnStock(tx, before.items);
      stockReturned = true;
    }
    return tx.order.update({ where: { id: orderId }, data: { status, stockReturned } });
  });

  const lang = before.user?.lang || 'uz';
  if (status !== 'new') await notifyCustomer(order.telegramId, lang, `status.${status}`, order.id);
  return order;
}

module.exports = { create, setStatus, STATUSES };
