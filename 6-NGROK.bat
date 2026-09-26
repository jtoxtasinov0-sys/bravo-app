@echo off
chcp 65001 >nul
title Bravo - NGROK (https manzil) - oynani yopmang
echo "Forwarding" qatoridagi https://....ngrok-free.app manzilini nusxalab,
echo backend\.env dagi PUBLIC_URL, MINIAPP_URL va ADMIN_URL ga yozing (README ga qarang).
echo.
ngrok http 5000
pause
