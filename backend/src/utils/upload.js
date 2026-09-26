// Rasm yuklash (multer) va fayl yo'llari
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const FOLDERS = ['products', 'stories', 'receipts', 'broadcast'];
for (const f of FOLDERS) fs.mkdirSync(path.join(UPLOAD_ROOT, f), { recursive: true });

const randomName = (ext) => `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;

// folder — products | stories | receipts | broadcast
function uploader(folder) {
  if (!FOLDERS.includes(folder)) throw new Error('Noma\'lum papka: ' + folder);
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_ROOT, folder)),
      filename: (_req, file, cb) => {
        const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase().slice(0, 6);
        cb(null, randomName(ext));
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
      if (/^image\//.test(file.mimetype)) cb(null, true);
      else cb(new Error('Faqat rasm yuklash mumkin'));
    },
  });
}

// Diskdagi fayl -> brauzer uchun manzil ("/uploads/products/abc.jpg")
const publicPath = (folder, filename) => `/uploads/${folder}/${filename}`;

// "/uploads/products/abc.jpg" -> diskdagi to'liq yo'l (topilmasa null)
function diskPath(url) {
  if (!url || !url.startsWith('/uploads/')) return null;
  const p = path.normalize(path.join(UPLOAD_ROOT, url.replace('/uploads/', '')));
  if (!p.startsWith(UPLOAD_ROOT) || !fs.existsSync(p)) return null;
  return p;
}

// Telegram'dan kelgan faylni saqlash (chek rasmi)
async function saveBuffer(folder, buffer, ext = '.jpg') {
  const name = randomName(ext);
  await fs.promises.writeFile(path.join(UPLOAD_ROOT, folder, name), buffer);
  return publicPath(folder, name);
}

module.exports = { UPLOAD_ROOT, uploader, publicPath, diskPath, saveBuffer };
