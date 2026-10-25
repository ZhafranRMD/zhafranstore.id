@echo off
title Zhafranstore.id - Peluncur Toko Game & Gamepass
echo ========================================================
echo        Memulai Server Lokal Zhafranstore.id...
echo ========================================================
echo.
echo [1/2] Membuka browser ke http://localhost:5173/ ...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173/"
echo [2/2] Menjalankan server pengembangan Vite...
npm.cmd run dev -- --host
pause
