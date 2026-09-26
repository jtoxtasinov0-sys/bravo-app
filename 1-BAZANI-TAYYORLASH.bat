@echo off
chcp 65001 >nul
title Bravo - bazani tayyorlash
cd /d "%~dp0backend"
echo === 1/3 Backend paketlari o'rnatilmoqda...
call npm install || goto xato
echo === 2/3 Baza jadvallari yaratilmoqda (Prisma migratsiya)...
call npx prisma migrate deploy || goto xato
echo === 3/3 Boshlang'ich mahsulotlar qo'shilmoqda (seed)...
call npm run db:seed || goto xato
echo.
echo ✅ Tayyor! Endi 2-BACKEND.bat ni ishga tushiring.
pause
exit /b 0
:xato
echo.
echo ❌ Xatolik. Yuqoridagi yozuvni o'qing (ko'pincha backend\.env dagi DATABASE_URL xato bo'ladi).
pause
