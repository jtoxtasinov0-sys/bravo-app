// Boshlang'ich mahsulotlar: bravo_katalog/katalog.json dan
// Bazada bor mahsulotga tegmaydi (admin o'zgarishlari saqlanadi), yangilarini qo'shadi.
// SEED_FORCE=1 bo'lsa — hammasini katalogdagidek qayta yozadi.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cfg = require('../src/config/default');
const { PRESET_COLORS } = require('../src/utils/colors');

const prisma = new PrismaClient();
const FORCE = process.env.SEED_FORCE === '1';

// Katalog fayli: loyiha ichidagi nusxa yoki yuqoridagi bravo_katalog papkasi
const CATALOG = [path.join(__dirname, 'katalog.json'), path.join(__dirname, '..', '..', 'bravo_katalog', 'katalog.json')].find(
  (p) => fs.existsSync(p)
);

// ⚠️ NAMUNAVIY NARXLAR — katalogda narx yo'q edi. Admin paneldan o'zgartiring!
const DEFAULT_PRICES = {
  oyoq_kiyim: { price: 350000, wholesalePrice: 310000 },
  futbolka_polo: { price: 150000, wholesalePrice: 130000 },
  koylak: { price: 220000, wholesalePrice: 190000 },
  komplekt: { price: 650000, wholesalePrice: 580000 },
  kurtka: { price: 550000, wholesalePrice: 490000 },
};

// Ruscha nomlar
const RU = {
  1: 'Тёмно-синие текстильные слипоны',
  2: 'Витрина обуви (разные модели)',
  3: 'Бежевые текстильные мокасины (BOSS)',
  4: 'Слипоны цвета хаки',
  5: 'Чёрно-серые замшевые кроссовки',
  6: 'Чёрные кожаные кроссовки',
  7: 'Тёмно-синие кроссовки EA7',
  8: 'Серо-чёрные спортивные кроссовки',
  9: 'Чёрные замшевые слипоны',
  10: 'Чёрные замшевые лоферы',
  11: 'Серые замшевые лоферы',
  12: 'Чёрные текстильные слипоны',
  13: 'Коричневое поло с V-вырезом',
  14: 'Коричневая футболка с логотипом',
  15: 'Тёмно-серая дизайнерская футболка',
  16: 'Терракотовая футболка с карманом',
  17: 'Оранжевая футболка BOSS',
  18: 'Чёрная футболка Zegna',
  19: 'Зелёная футболка',
  20: 'Голубая футболка',
  21: 'Оливковая футболка с карманом',
  22: 'Белая футболка с надписью',
  23: 'Серо-голубая рубашка',
  24: 'Оливковая рубашка',
  25: 'Серый бомбер + брюки + обувь',
  26: 'Белая льняная рубашка + зелёные брюки + кроссовки',
  27: 'Бежевая куртка + футболка + брюки + кроссовки',
  28: 'Тёмно-синяя куртка + джинсы + слипоны',
  29: 'Чёрное поло на молнии + белые брюки + кроссовки',
  30: 'Трикотажное поло в полоску + чёрные джинсы + лоферы',
  31: 'Футболка реглан + брюки с лампасами + слипоны',
  32: 'Зелёная куртка PUMA + брюки + слипоны',
  33: 'Белая футболка + чёрные брюки + лоферы',
  34: 'Бежевая футболка + брюки + кроссовки',
  35: 'Чёрная рубашка + белые джинсы + кроссовки',
  36: 'Чёрное поло + брюки + кроссовки',
  37: 'Синий спортивный костюм + замшевые кроссовки',
  38: 'Тёмно-синяя рубашка-куртка',
  39: 'Коричневый трикотажный бомбер',
  40: 'Тёмно-синяя зимняя куртка (меховой воротник)',
  41: 'Зимний пуховик',
};

// Nomdagi birinchi rang so'zidan rangni aniqlash
const COLOR_WORDS = [
  ["to'q ko'k", "To'q ko'k"],
  ["to'q sariq", "To'q sariq"],
  ["to'q kulrang", 'Kulrang'],
  ['kulrang', 'Kulrang'],
  ['qora', 'Qora'],
  ['oq ', 'Oq'],
  ['bej', 'Bej'],
  ['jigarrang', 'Jigarrang'],
  ['xaki', 'Xaki'],
  ['zaytun', 'Zaytun'],
  ['yashil', 'Yashil'],
  ['terrakota', 'Terrakota'],
  ['moviy', 'Moviy'],
  ["ko'k", "Ko'k"],
];
function detectColor(name) {
  const n = name.toLowerCase() + ' ';
  let best = null;
  for (const [word, colorName] of COLOR_WORDS) {
    const i = n.indexOf(word);
    if (i >= 0 && (!best || i < best.i)) best = { i, colorName };
  }
  if (!best) return null;
  const c = PRESET_COLORS.find((x) => x.name === best.colorName);
  return c ? { name: c.name, hex: c.hex } : null;
}

// Teg: nomi va kategoriyasiga qarab
function detectTag(m) {
  const n = m.nomi.toLowerCase();
  if (/qishki|pufli|mo'yna/.test(n)) return 'Qishki';
  if (/sport|krossovka|ea7|puma/.test(n)) return 'Sport';
  if (/loafer|mokasin|ko'ylak|klassik/.test(n) || m.kategoriya === 'koylak') return 'Klassik';
  if (m.kategoriya === 'futbolka_polo') return 'Yozgi';
  return 'Kundalik';
}

async function main() {
  if (!CATALOG) throw new Error('katalog.json topilmadi');
  const data = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  let added = 0;
  let skipped = 0;
  let updated = 0;

  for (const m of data.mahsulotlar) {
    const cat = cfg.categories.find((c) => c.key === m.kategoriya);
    if (!cat) {
      console.warn('Kategoriya topilmadi:', m.kategoriya);
      continue;
    }
    const prices = DEFAULT_PRICES[m.kategoriya] || { price: 200000, wholesalePrice: null };
    const article = `BR-${String(m.id).padStart(3, '0')}`;
    const image = '/uploads/products/' + path.basename(m.rasm);
    const color = detectColor(m.nomi);
    const record = {
      article,
      name: m.nomi,
      nameRu: RU[m.id] || null,
      description: `${cat.uz}. Bravo do'konidan sifatli erkaklar kiyimi.`,
      descriptionRu: `${cat.ru}. Качественная мужская одежда от Bravo.`,
      category: m.kategoriya,
      tag: detectTag(m),
      images: [image],
      imageFrames: [{ zoom: 1, x: 50, y: 50 }],
      imageColors: [color],
      price: typeof m.narx === 'number' && m.narx > 0 ? m.narx : prices.price,
      wholesalePrice: prices.wholesalePrice,
      wholesaleMin: 1,
      sizes: cat.sizes,
      unit: cat.unit,
      instagram: m.instagram || null,
      isPopular: [3, 7, 13, 18, 25, 29, 40].includes(m.id),
      sortOrder: m.id,
    };

    const exists = await prisma.product.findUnique({ where: { article } });
    if (exists && !FORCE) {
      skipped++;
      continue;
    }
    if (exists) {
      await prisma.product.update({ where: { article }, data: record });
      updated++;
    } else {
      await prisma.product.create({ data: record });
      added++;
    }
  }

  // Namunaviy storylar (faqat bitta ham story bo'lmasa)
  if ((await prisma.story.count()) === 0) {
    const pick = async (article) => prisma.product.findUnique({ where: { article } });
    const stories = [
      { a: 'BR-025', title: 'Yangi LOOK', titleRu: 'Новый LOOK' },
      { a: 'BR-007', title: 'Krossovkalar', titleRu: 'Кроссовки' },
      { a: 'BR-018', title: 'Futbolkalar', titleRu: 'Футболки' },
      { a: 'BR-040', title: 'Qishki', titleRu: 'Зима' },
    ];
    for (const [i, s] of stories.entries()) {
      const p = await pick(s.a);
      if (p) await prisma.story.create({ data: { title: s.title, titleRu: s.titleRu, image: p.images[0], productId: p.id, sortOrder: i } });
    }
  }

  console.log(`✅ Seed tugadi: ${added} ta qo'shildi, ${updated} ta yangilandi, ${skipped} ta o'zgarishsiz qoldi.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
