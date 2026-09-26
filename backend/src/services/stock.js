// Ombor: buyurtmada qoldiqni ayirish, bekor qilinsa qaytarish (tranzaksiya ichida)
// null qoldiq = cheklov yo'q (hisoblanmaydi)

class StockError extends Error {}

// tx — prisma tranzaksiya klienti; lines — pricing.calculate() natijasidagi qatorlar
async function takeStock(tx, lines, lang = 'uz') {
  const ru = lang === 'ru';
  const problems = [];
  for (const l of lines) {
    const p = await tx.product.findUnique({ where: { id: l.productId } });
    if (!p) continue;
    if (l.mode === 'wholesale') {
      if (p.stockPacks === null) continue;
      if (p.stockPacks < l.packs) {
        problems.push(`${l.name} — ${p.stockPacks} ${ru ? 'компл.' : 'komplekt'}`);
        continue;
      }
      // Shart bilan kamaytiramiz — bir vaqtdagi ikki buyurtma qoldiqni minusga tushirmasin
      const r = await tx.product.updateMany({
        where: { id: p.id, stockPacks: { gte: l.packs } },
        data: { stockPacks: { decrement: l.packs } },
      });
      if (r.count === 0) problems.push(`${l.name} — ${ru ? 'нет в наличии' : 'qolmadi'}`);
    } else {
      if (!p.stockPairs || typeof p.stockPairs !== 'object') continue;
      const pairs = { ...p.stockPairs };
      for (const [s, q] of Object.entries(l.sizeQty || {})) {
        const left = Number(pairs[s] ?? 0);
        if (left < q) problems.push(`${l.name} (${s}) — ${left}`);
        else pairs[s] = left - q;
      }
      await tx.product.update({ where: { id: p.id }, data: { stockPairs: pairs } });
    }
  }
  if (problems.length) {
    throw new StockError((ru ? 'На складе недостаточно: ' : 'Omborda yetarli emas: ') + problems.join('; '));
  }
}

// Bekor qilingan buyurtma qoldig'ini qaytarish
async function returnStock(tx, items) {
  for (const l of items || []) {
    const p = await tx.product.findUnique({ where: { id: l.productId } });
    if (!p) continue;
    if (l.mode === 'wholesale') {
      if (p.stockPacks !== null) await tx.product.update({ where: { id: p.id }, data: { stockPacks: { increment: l.packs || 0 } } });
    } else if (p.stockPairs && typeof p.stockPairs === 'object') {
      const pairs = { ...p.stockPairs };
      for (const [s, q] of Object.entries(l.sizeQty || {})) pairs[s] = Number(pairs[s] ?? 0) + Number(q || 0);
      await tx.product.update({ where: { id: p.id }, data: { stockPairs: pairs } });
    }
  }
}

module.exports = { takeStock, returnStock, StockError };
