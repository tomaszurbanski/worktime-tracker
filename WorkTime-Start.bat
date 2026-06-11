@echo off
title WorkTime Tracker

echo.
echo  ====================================================
echo   WorkTime Tracker  ^|  TU Automation
echo  ====================================================
echo.

set ADB="C:\Users\t_urb\AppData\Local\Android\Sdk\platform-tools\adb.exe"

echo [1/5] Zabijanie starych procesow Metro/Node na porcie 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081 "') do (
    echo   Zabijam PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
taskkill /F /IM "qemu-system-x86_64.exe" /T >nul 2>&1
taskkill /F /IM "emulator.exe" /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Czyszczenie ADB...
%ADB% -s emulator-5554 emu kill >nul 2>&1
%ADB% -s emulator-5556 emu kill >nul 2>&1
%ADB% -s emulator-5558 emu kill >nul 2>&1
%ADB% -s emulator-5560 emu kill >nul 2>&1
%ADB% -s emulator-5562 emu kill >nul 2>&1
%ADB% disconnect >nul 2>&1
%ADB% kill-server >nul 2>&1
timeout /t 2 /nobreak >nul
%ADB% start-server >nul 2>&1

echo [3/5] Urzadzenia ADB:
%ADB% devices

echo.
echo [4/5] Wersje:
node --version
npx expo --version

echo.
echo [5/5] Start Expo (tunnel)...
echo.

cd /d "C:\Users\t_urb\Projects\worktime-tracker"
npx expo start --tunnel

echo.
echo ========================================
echo  EXPO ZAKONCZYL - KOD: %ERRORLEVEL%
echo ========================================
pause
