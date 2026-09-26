@echo off
chcp 65001 >nul
title Bravo - ADMIN PANEL (5174) - oynani yopmang
cd /d "%~dp0admin"
if not exist node_modules call npm install
echo Brauzerda oching: http://localhost:5174/admin/
call npm run dev
pause
