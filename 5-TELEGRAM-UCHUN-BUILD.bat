@echo off
chcp 65001 >nul
title Bravo - Telegram uchun build
echo Mini App va Admin panel "build" qilinmoqda. Keyin backend ularni o'zi ko'rsatadi:
echo    http://localhost:5000/        - Mini App
echo    http://localhost:5000/admin/  - Admin panel
echo.
cd /d "%~dp0miniapp"
if not exist node_modules call npm install
call npm run build || goto xato
cd /d "%~dp0admin"
if not exist node_modules call npm install
call npm run build || goto xato
echo.
echo ✅ Tayyor! Endi 2-BACKEND.bat ni (qayta) ishga tushiring, keyin 6-NGROK.bat.
pause
exit /b 0
:xato
echo ❌ Build xatosi — yuqoridagi yozuvni o'qing.
pause
