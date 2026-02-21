@echo off
title Photo Swiper Setup
echo ===========================================
echo   Photo Swiper Setup for Windows
echo ===========================================

:: Check for Node
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo.
echo Installing Dependencies...
call npm install

echo.
echo Starting Photo Swiper...
echo Your browser will open automatically. Please keep this window open to keep the server running.

:: Start server asynchronously and then open browser
start /b cmd /c "npm run dev"

:: Wait 5 seconds for next.js to initialize
timeout /t 5 /nobreak >nul

:: Open browser
start http://localhost:3000
