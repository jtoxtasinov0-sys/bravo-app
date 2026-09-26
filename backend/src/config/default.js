// ===================================================================
//  BREND SOZLAMALARI — yangi do'kon uchun faqat shu faylni o'zgartiring
// ===================================================================
require('dotenv').config();

const env = (k, d = '') => (process.env[k] ?? d).toString().trim();
const httpsOr = (v, d) => (/^https:\/\//i.test(v) ? v : d);

module.exports = {
  port: Number(env('PORT', '5000')),
  isProd: env('NODE_ENV') === 'production',

  botToken: env('BOT_TOKEN'),
  botUsername: env('BOT_USERNAME', 'bravo_andijonbot'),
  adminChatIds: env('ADMIN_CHAT_IDS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Mini App va Admin panel manzillari (Telegram faqat https qabul qiladi).
  // Env bo'sh yoki https emas bo'lsa — Vercel'dagi manzillar
  miniappUrl: httpsOr(env('MINIAPP_URL'), 'https://bravo-miniapp.vercel.app'),
  adminUrl: httpsOr(env('ADMIN_URL'), 'https://bravo-admin-five.vercel.app'),
  // Backend'ning ochiq https manzili. Bo'sh bo'lsa — bot polling rejimida ishlaydi
  publicUrl: env('PUBLIC_URL') || env('RENDER_EXTERNAL_URL'),

  adminUsername: env('ADMIN_USERNAME', 'admin'),
  adminPassword: env('ADMIN_PASSWORD', 'bravo12345'),
  jwtSecret: env('JWT_SECRET', 'bravo-local-secret-ALMASHTIRING'),

  click: {
    serviceId: env('CLICK_SERVICE_ID'),
    merchantId: env('CLICK_MERCHANT_ID'),
  },
  // Karta (admin paneldagi Sozlamalar ustun turadi)
  card: {
    number: env('PAYMENT_CARD'),
    holder: env('PAYMENT_CARD_HOLDER'),
    type: env('PAYMENT_CARD_TYPE'),
  },

  company: {
    name: 'Bravo',
    slogan: "Bu yerdan siz o'z obro'yingizni yaratishingiz mumkin",
    sloganRu: 'Здесь вы создаёте свой имидж',
    about: "Erkaklar kiyim do'koni",
    aboutRu: 'Магазин мужской одежды',
    phone: env('COMPANY_PHONE', '+998937819999'),
    address: env('COMPANY_ADDRESS', 'Andijon'),
    instagram: 'https://www.instagram.com/bravo_andijon_/',
  },

  // Kategoriyalar: sizes — shu kategoriya uchun standart razmerlar, unit — o'lchov birligi
  categories: [
    { key: 'futbolka_polo', uz: 'Futbolka va polo', ru: 'Футболки и поло', icon: '👕', unit: 'dona', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { key: 'komplekt', uz: 'Komplekt / LOOK', ru: 'Комплекты / LOOK', icon: '🧥', unit: 'dona', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { key: 'koylak', uz: "Ko'ylaklar", ru: 'Рубашки', icon: '👔', unit: 'dona', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { key: 'kurtka', uz: 'Kurtka va ustki kiyim', ru: 'Куртки и верхняя одежда', icon: '🧥', unit: 'dona', sizes: ['M', 'L', 'XL', 'XXL', '3XL'] },
    { key: 'oyoq_kiyim', uz: 'Oyoq kiyimlar', ru: 'Обувь', icon: '👟', unit: 'juft', sizes: ['39', '40', '41', '42', '43', '44'] },
  ],

  tags: [
    { key: 'Klassik', uz: 'Klassik', ru: 'Классика' },
    { key: 'Sport', uz: 'Sport', ru: 'Спорт' },
    { key: 'Kundalik', uz: 'Kundalik', ru: 'Повседневный' },
    { key: 'Yozgi', uz: 'Yozgi', ru: 'Летний' },
    { key: 'Qishki', uz: 'Qishki', ru: 'Зимний' },
  ],

  units: {
    dona: { uz: 'dona', ru: 'шт' },
    juft: { uz: 'juft', ru: 'пар' },
  },

  regions: [
    { uz: 'Andijon viloyati', ru: 'Андижанская область' },
    { uz: 'Toshkent shahri', ru: 'город Ташкент' },
    { uz: 'Toshkent viloyati', ru: 'Ташкентская область' },
    { uz: "Farg'ona viloyati", ru: 'Ферганская область' },
    { uz: 'Namangan viloyati', ru: 'Наманганская область' },
    { uz: 'Samarqand viloyati', ru: 'Самаркандская область' },
    { uz: 'Buxoro viloyati', ru: 'Бухарская область' },
    { uz: 'Navoiy viloyati', ru: 'Навоийская область' },
    { uz: 'Qashqadaryo viloyati', ru: 'Кашкадарьинская область' },
    { uz: 'Surxondaryo viloyati', ru: 'Сурхандарьинская область' },
    { uz: 'Jizzax viloyati', ru: 'Джизакская область' },
    { uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область' },
    { uz: 'Xorazm viloyati', ru: 'Хорезмская область' },
    { uz: "Qoraqalpog'iston Respublikasi", ru: 'Республика Каракалпакстан' },
  ],
};
