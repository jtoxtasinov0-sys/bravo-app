@echo off
chcp 65001 >nul
title Bravo - BACKEND (5000) - oynani yopmang
cd /d "%~dp0backend"
if not exist node_modules call npm install
call npm start
pause
