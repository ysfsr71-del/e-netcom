@echo off
chcp 65001 >nul
title e-NetCoM V_FINAL
cd /d "%~dp0"
echo ================================================
echo e-NetCoM - Yeni Dijital Platform V_FINAL
echo ================================================
echo.
echo Harita dosyasi kontrol ediliyor...
if not exist "public\turkey.svg" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing 'https://simplemaps.com/static/svg/country/tr/admin1/tr.svg' -OutFile 'public\turkey.svg'; Write-Host 'Turkiye haritasi indirildi.' } catch { Write-Host 'Harita zaten mevcut degil; mevcut site haritasi kullanilacak.' }"
) else echo Turkiye haritasi mevcut.
echo.
echo Site baslatiliyor...
echo Port 3000 kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul
node server.js
pause
