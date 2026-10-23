@echo off
title POS PLUS - Clothing Shop Billing Software
cd /d "%~dp0"

echo ==========================================================
echo        POS PLUS - CLOTHING SHOP BILLING SYSTEM
echo ==========================================================
echo.
echo [1/2] Starting Local Offline POS Server...
echo.

start "" /B cmd /c "npm.cmd run dev"

echo Waiting for server to initialize...
timeout /t 3 /nobreak > nul

echo [2/2] Opening POS PLUS in Desktop App Mode...

:: Try opening with Chrome in Application Mode (fullscreen borderless window)
start "" "chrome.exe" --app=http://localhost:3000 2>nul
if %errorlevel% neq 0 (
    :: Fallback to Microsoft Edge Application Mode
    start "" "msedge.exe" --app=http://localhost:3000 2>nul
    if %errorlevel% neq 0 (
        :: Fallback to default browser
        start "" "http://localhost:3000"
    )
)

echo.
echo ==========================================================
echo   POS PLUS is now active at http://localhost:3000
echo   Minimize this window while using the software.
echo ==========================================================
