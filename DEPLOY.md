# Internetga joylash: Neon + Render + Vercel

Kompyuter o'chiq bo'lsa ham do'kon ishlashi uchun. Hammasi bepul rejada ishlaydi.

## 1. GitHub
1. https://github.com da yangi **private** repo yarating (masalan `bravo-shop`).
2. Loyiha papkasini yuklang (`.env` fayllar `.gitignore` tufayli yuklanmaydi — bu to'g'ri).

## 2. Baza — Neon
Baza allaqachon tayyor. Render'da ikki manzil kerak:
- `DATABASE_URL` — `-pooler` bilan (ilova uchun)
- `DIRECT_URL` — `-pooler` SIZ (migratsiya uchun)

## 3. Backend — Render.com
1. **New → Web Service** → GitHub repo'ni tanlang.
2. Sozlamalar:
   - **Root Directory:** `backend`
   - **Region:** Frankfurt
   - **Build Command:** `npm install --include=dev && npx prisma migrate deploy && npm run db:seed`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
   - `PORT` ni **qo'ymang** — Render o'zi beradi.
3. **Environment** bo'limiga `backend/.env` dagi qatorlarni kiriting, farqi:
   - `NODE_ENV=production`
   - `NODE_VERSION=20`
   - `PUBLIC_URL` — bo'sh (Render `RENDER_EXTERNAL_URL` ni o'zi beradi)
   - `MINIAPP_URL=https://bravo-miniapp.vercel.app` (4-bo'limdan keyin)
   - `ADMIN_URL=https://bravo-admin-five.vercel.app` (4-bo'limdan keyin)
   - `ADMIN_PASSWORD` va `JWT_SECRET` — **albatta yangi, kuchli** qiymat
4. Deploy tugagach: `https://xxx.onrender.com/api/health` → `{"ok":true}`.

## 4. Mini App va Admin — Vercel
Ikkita alohida loyiha:

| | Mini App | Admin |
|---|---|---|
| Root Directory | `miniapp` | `admin` |
| Framework | Vite | Vite |
| Environment | `VITE_API_URL=https://xxx.onrender.com` | `VITE_API_URL=https://xxx.onrender.com` |

> Vercel'da admin panel o'zi ildizdan (`/`) ochiladi, lokalda esa `/admin/` da. `ADMIN_BASE` qo'yish shart emas.

Zaxira: `VITE_API_URL` unutilsa `https://bravo-backend.onrender.com` ishlatiladi (`PROD_API_URL`). Render manzili boshqacha bo'lsa — `miniapp/src/lib/api.js` va `admin/src/lib/api.js` da o'zgartiring.

Vercel manzillarini Render'dagi `MINIAPP_URL` / `ADMIN_URL` ga yozib, Render'da **Manual Deploy** qiling.

## 5. Uxlab qolmaslik
Render bepul reja 15 daqiqa so'rovsiz qolsa uxlaydi. Himoya:
- Bot webhook rejimida — Telegram so'rovi serverni uyg'otadi
- Server o'zini har 10 daqiqada ping qiladi
- GitHub Actions: repo → Settings → Secrets → Actions → `BACKEND_URL=https://xxx.onrender.com` (`.github/workflows/keep-alive.yml`)

## Xatolar jadvali

| Muammo | Yechim |
|---|---|
| `prisma migrate deploy` Neon'da osilib qoladi | `DIRECT_URL` `-pooler` SIZ bo'lishi kerak |
| Lokalda ishga tushirgandan keyin Render boti jim | Lokal backend webhook'ni o'ziga olgan. Render → **Manual Deploy** |
| Admin yuklagan rasmlar yo'qoldi | Render diski vaqtinchalik. **Persistent Disk** (`/opt/render/project/src/backend/uploads`) ulang |
| Vercel build'da localhost qoldi | `VITE_API_URL` env yoki `PROD_API_URL` zaxirasi |
| Vercel monorepo build yiqildi | Har loyihada **Root Directory** to'g'ri tanlanganini tekshiring |
| Adminga xabarda rang "belgilanmagan" | Admin paneldagi mahsulot rasmiga rang biriktiring |
| Bot birinchi bo'lib yozmaydi | Admin avval botga /start bosishi shart |
