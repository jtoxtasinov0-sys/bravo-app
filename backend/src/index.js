// Bravo backend: Express API + Telegram bot + (ixtiyoriy) tayyor saytlarni tarqatish
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const cfg = require('./config/default');
const prisma = require('./database/connection');
const { UPLOAD_ROOT } = require('./utils/upload');
const { createBot, startBot } = require('./core/bot');
const botController = require('./controllers/botController');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Rasmlar
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d' }));

// Server tirikligini tekshirish (Render / keep-alive uchun)
app.get('/api/health', async (_req, res) => {
  let db = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'error';
  }
  res.json({ ok: true, db, time: new Date().toISOString() });
});

app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api', require('./routes/client.routes'));

// Agar Mini App / Admin panel "build" qilingan bo'lsa — shu serverning o'zi ko'rsatadi.
// Shunda ngrok bilan bitta manzil yetadi: https://xxx.ngrok-free.app  va  .../admin/
function serveSpa(urlPrefix, dir) {
  const index = path.join(dir, 'index.html');
  if (!fs.existsSync(index)) return false;
  app.use(urlPrefix, express.static(dir, { index: false, maxAge: '1h' }));
  app.get(urlPrefix === '/' ? /^\/(?!api\/|uploads\/|admin\/?).*/ : new RegExp(`^${urlPrefix}(/.*)?$`), (_req, res) =>
    res.sendFile(index)
  );
  return true;
}
const adminDist = path.join(__dirname, '..', '..', 'admin', 'dist');
const miniDist = path.join(__dirname, '..', '..', 'miniapp', 'dist');
const hasAdmin = serveSpa('/admin', adminDist);
const hasMini = serveSpa('/', miniDist);

// Xatolar
app.use((err, _req, res, _next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server xatosi' });
});

async function main() {
  const bot = createBot();
  if (bot) botController.register(bot);

  app.listen(cfg.port, async () => {
    console.log(`\n✅ Backend ishga tushdi: http://localhost:${cfg.port}`);
    console.log(`   Tekshirish: http://localhost:${cfg.port}/api/health`);
    if (hasMini) console.log(`   Mini App (build): http://localhost:${cfg.port}/`);
    if (hasAdmin) console.log(`   Admin panel (build): http://localhost:${cfg.port}/admin/`);
    try {
      await startBot(app);
    } catch (e) {
      console.error('❌ Botni ishga tushirib bo\'lmadi:', e.message);
    }
  });

  // Render bepul rejada uxlamasligi uchun o'zini ping qiladi (har 10 daqiqada)
  if (cfg.publicUrl && /^https:/.test(cfg.publicUrl) && cfg.isProd) {
    setInterval(() => fetch(cfg.publicUrl.replace(/\/$/, '') + '/api/health').catch(() => {}), 10 * 60 * 1000);
  }
}

main();

process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e));
