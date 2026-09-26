// Sozlamalar (key/value) — admin paneldan o'zgaradi
const prisma = require('../database/connection');
const cfg = require('../config/default');

const DEFAULTS = {
  cardNumber: cfg.card.number,
  cardHolder: cfg.card.holder,
  cardType: cfg.card.type || 'Uzcard',
  retailEnabled: 'true',
  wholesaleEnabled: 'true',
};

async function getAll() {
  const rows = await prisma.setting.findMany();
  const out = { ...DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

async function setMany(obj) {
  const keys = Object.keys(DEFAULTS);
  for (const [k, v] of Object.entries(obj || {})) {
    if (!keys.includes(k)) continue;
    const value = String(v ?? '').slice(0, 200);
    await prisma.setting.upsert({ where: { key: k }, update: { value }, create: { key: k, value } });
  }
  return getAll();
}

module.exports = { getAll, setMany, DEFAULTS };
