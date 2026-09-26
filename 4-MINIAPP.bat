@echo off
chcp 65001 >nul
title Bravo - MINI APP (5173) - oynani yopmang
cd /d "%~dp0miniapp"
if not exist node_modules call npm install
echo Brauzerda oching: http://localhost:5173
call npm run dev
pause
