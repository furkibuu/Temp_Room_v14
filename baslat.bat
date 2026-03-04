@echo off
title Furkibu_ Temp Room V2
chcp 65001 >nul
:baslat
echo ==================================
echo   Furkibu_ Temp Room Baslat
echo ==================================
echo.

REM .env kontrol
if not exist ".env" (
echo [HATA] .env dosyasi bulunamadi!
echo Lutfen .env dosyasini olusturun.
pause
exit /b
)

REM node_modules kontrol
if not exist "node_modules" (
echo [BILGI] node_modules bulunamadi...
echo Paketler yukleniyor...
npm install
echo.
)

echo ================================
echo Slash komutlari deploy ediliyor
echo ================================
node scripts/deploy-commands.js

echo.
echo ================================
echo Bot baslatiliyor...
echo ================================
echo.

node furki.js

echo.
echo -----------------------------------------
echo [UYARI] Bot kapandi veya coktu!
echo 3 Saniye icinde yeniden baslatiliyor...
echo -----------------------------------------
timeout /t 3 >nul
goto baslat 