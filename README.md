# Bravo — Telegram do'kon (Bot + Mini App + Admin panel)

Erkaklar kiyim do'koni **Bravo** (@bravo_andijon_) uchun Telegram Mini App.

| Qism | Papka | Nima qiladi | Lokal manzil |
|---|---|---|---|
| Backend + Bot | `backend/` | API, baza, Telegram bot | http://localhost:5000 |
| Mini App | `miniapp/` | Mijozlar do'koni (katalog, savatcha, buyurtma) | http://localhost:5173 |
| Admin panel | `admin/` | Buyurtmalar, mahsulotlar, ombor, rassilka | http://localhost:5174/admin/ |
| Baza | — | PostgreSQL (Neon) | — |

---

## 0. Kompyuterga bir marta o'rnatiladigan dasturlar

1. **Node.js 20 yoki yangiroq** — https://nodejs.org → "LTS" tugmasi → o'rnating (hamma joyda "Next").
   Tekshirish (PowerShell yoki CMD da):
   ```bash
   node -v
   ```
2. **ngrok** — https://ngrok.com/download → ro'yxatdan o'ting (bepul) → Windows uchun yuklab oling.
   Saytdagi "Your Authtoken" sahifasidan komandani nusxalab bir marta ishga tushiring:
   ```bash
   ngrok config add-authtoken SIZNING_TOKENINGIZ
   ```

---

## 1. Sozlamalar fayli: `backend/.env`

`backend/.env` faylini Bloknot bilan oching. Eng muhim qatorlar:

| Qator | Nima yoziladi |
|---|---|
| `DATABASE_URL` | Neon manzili (**-pooler** bilan) — allaqachon yozilgan |
| `DIRECT_URL` | Neon manzili (**-pooler SIZ**) — migratsiya uchun, allaqachon yozilgan |
| `BOT_TOKEN` | @BotFather bergan token |
| `ADMIN_CHAT_IDS` | Buyurtmalar keladigan chat ID (botga `/id` yozib bilasiz). Bir nechta bo'lsa — vergul bilan |
| `ADMIN_PASSWORD` | Admin panelga kirish paroli (o'zingiz xohlagancha o'zgartiring) |
| `PUBLIC_URL`, `MINIAPP_URL`, `ADMIN_URL` | ngrok manzili (pastda 4-bo'lim) |

> ⚠️ `.env` — maxfiy fayl. Hech kimga yubormang, GitHub'ga yuklamang.

---

## 2. Paketlarni o'rnatish

Loyiha papkasida PowerShell oching (papkada **Shift + o'ng tugma → "Open PowerShell window here"**), keyin:

```bash
cd backend
npm install
cd ..\miniapp
npm install
cd ..\admin
npm install
cd ..
```

> Yoki shunchaki **`1-BAZANI-TAYYORLASH.bat`** ni ikki marta bosing — backend paketlari, baza va seed bir yo'la bajariladi.

---

## 3. Baza: Prisma migratsiyasi va seed

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
cd ..
```

- `migrate deploy` — bazada jadvallarni yaratadi (`backend/prisma/migrations` dagi fayllar bo'yicha).
- `db:seed` — `bravo_katalog` dagi **41 ta mahsulot** va 4 ta storyni qo'shadi. Qayta ishga tushirsangiz — bor mahsulotlarga tegmaydi.
- Hammasini katalogdagidek qayta yozish kerak bo'lsa: PowerShell'da `$env:SEED_FORCE="1"; npm run db:seed`

**Sxemani o'zgartirsangiz** (`schema.prisma`), yangi migratsiya yaratish:
```bash
cd backend
npx prisma migrate dev --name ozgarish_nomi
```

Bazani jadval ko'rinishida ko'rish: `npx prisma studio`

> ⚠️ Katalogda narxlar yo'q edi, shuning uchun seed **namunaviy narxlar** qo'ydi (masalan, oyoq kiyim 350 000 / optom 310 000). Admin paneldan haqiqiy narxlarni kiriting.

---

## 4. Localhost'da ishga tushirish (brauzerda sinash)

Uchta alohida oyna kerak (yoki `.bat` fayllarni ikki marta bosing):

| Oyna | Komanda | Yoki |
|---|---|---|
| 1 | `cd backend` → `npm start` | `2-BACKEND.bat` |
| 2 | `cd miniapp` → `npm run dev` | `4-MINIAPP.bat` |
| 3 | `cd admin` → `npm run dev` | `3-ADMIN-PANEL.bat` |

Keyin brauzerda:
- Mini App: **http://localhost:5173** — Telegram tashqarisida "Demo Mijoz" nomidan ishlaydi
- Admin panel: **http://localhost:5174/admin/** — login `admin`, parol `.env` dagi `ADMIN_PASSWORD`
- Server tekshiruvi: http://localhost:5000/api/health → `{"ok":true,"db":"ok"}`

Oynalarni yopmang — yopsangiz, o'sha qism to'xtaydi.

---

## 5. ngrok orqali Telegram botga ulash

Telegram Mini App faqat **https** manzilni ochadi. ngrok kompyuteringizdagi serverga vaqtinchalik https manzil beradi.

**Qadam 1 — saytlarni "build" qilish** (backend ularni o'zi ko'rsatadi, ngrok'ga bitta manzil yetadi):
```bash
cd miniapp
npm run build
cd ..\admin
npm run build
cd ..
```
(yoki `5-TELEGRAM-UCHUN-BUILD.bat`)

**Qadam 2 — backend'ni ishga tushirish** (ishlab turgan bo'lsa ham qayta ishga tushiring):
```bash
cd backend
npm start
```

**Qadam 3 — ngrok** (yangi oynada):
```bash
ngrok http 5000
```
Chiqqan `Forwarding  https://abcd-1234.ngrok-free.app -> http://localhost:5000` qatoridagi **https** manzilni nusxalang.

**Qadam 4 — `backend/.env` ga yozing** (o'z manzilingiz bilan):
```
PUBLIC_URL=https://abcd-1234.ngrok-free.app
MINIAPP_URL=https://abcd-1234.ngrok-free.app/
ADMIN_URL=https://abcd-1234.ngrok-free.app/admin/
```
Saqlang va backend oynasida **Ctrl + C** bosib, `npm start` bilan qayta ishga tushiring. Oynada shunday yozuv chiqishi kerak:
```
🤖 Bot webhook rejimida: https://abcd-1234.ngrok-free.app
🤖 Bot: @bravo_andijonbot
```

**Qadam 5 — Telegram'da tekshirish:**
1. @bravo_andijonbot ni oching → **/start**
2. **/id** yozing → chiqqan raqamni `.env` dagi `ADMIN_CHAT_IDS` ga yozing, backend'ni qayta ishga tushiring
   (yoki botga `/admin PAROL` yozing — `ADMIN_PASSWORD` dagi parol. Parolli xabar avtomatik o'chiriladi)
3. /start → **🛍 Do'konni ochish** — Mini App ochiladi. Pastdagi **Menu** tugmasi ham uni ochadi (backend o'zi o'rnatadi)
4. Buyurtma bering → buyurtma rasmlar bilan adminga keladi
5. Admin uchun /start da **⚙️ Admin panel** tugmasi chiqadi — Telegram ichida parolsiz kiradi

> **Eslatma:** bepul ngrok har safar ishga tushganda **yangi manzil** beradi (agar saytdan bepul "static domain" olmagan bo'lsangiz). Manzil o'zgarsa — 4-qadamni takrorlang.
> Bepul ngrok birinchi marta ochilganda "You are about to visit…" sahifasini ko'rsatishi mumkin — **Visit Site** ni bosing.

**BotFather'da (ixtiyoriy):** `/mybots` → bot → **Bot Settings → Menu Button** → manzil: `MINIAPP_URL`. Backend buni avtomatik qiladi, lekin qo'lda ham qo'yish mumkin.

---

## Bot buyruqlari

| Buyruq | Nima qiladi |
|---|---|
| `/start`, `/help` | Salom + Do'kon tugmasi (adminlarga — Admin panel ham) |
| `/id` | Chat ID ni ko'rsatadi (guruhda ham ishlaydi) |
| `/admin PAROL` | Odamni admin qiladi (1 soatda 5 ta xato urinish chegarasi) |
| Kontakt yuborish | Telefonni profilga saqlaydi |
| Rasm yuborish | Oxirgi to'lanmagan buyurtmaga chek sifatida biriktiriladi |

Buyurtmalarni guruhga olish: botni guruhga qo'shing → guruhda `/id` → chiqqan **minus bilan** raqamni `ADMIN_CHAT_IDS` ga qo'shing.

---

## Ko'p uchraydigan muammolar

| Muammo | Yechim |
|---|---|
| `P1001: Can't reach database` | Internetni tekshiring; `.env` dagi `DATABASE_URL`/`DIRECT_URL` to'g'rimi |
| Bot javob bermayapti | `BOT_TOKEN` to'g'rimi; backend oynasida `🤖 Bot: @...` yozuvi bormi |
| Adminga buyurtma kelmayapti | `ADMIN_CHAT_IDS` to'ldirilganmi; admin botga avval **/start** bosganmi (bot birinchi bo'lib yoza olmaydi) |
| "Do'konni ochish" tugmasi yo'q | `MINIAPP_URL` https bilan boshlanishi kerak (ngrok) |
| Mini App oq ekran | `5-TELEGRAM-UCHUN-BUILD.bat` ni ishga tushirib, backend'ni qayta yoqing |
| `EADDRINUSE: 5000` | Backend allaqachon boshqa oynada ishlayapti — o'sha oynani yoping |
| ngrok manzili ishlamay qoldi | ngrok qayta ishga tushgan, manzil o'zgargan — 5-bo'lim, 4-qadam |

Internetga doimiy joylash (Render + Vercel) — **DEPLOY.md** ga qarang.
