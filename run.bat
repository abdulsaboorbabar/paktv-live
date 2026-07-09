@echo off
title PAKTV Live - Local Dev Server
color 0A

echo.
echo  ============================================
echo   PAKTV Live - Starting Local Dev Server
echo  ============================================
echo.

:: Install dependencies if node_modules folder is missing
if not exist "node_modules" (
    echo  [1/2] Installing dependencies (first run only)...
    call npm install
    if errorlevel 1 (
        echo.
        echo  ERROR: npm install failed. Make sure Node.js is installed.
        pause
        exit /b 1
    )
    echo  Dependencies installed successfully.
    echo.
)

:: Open browser after a short delay
echo  [2/2] Starting server...
start "" /b timeout /t 2 >nul
start "" "http://localhost:8000"

:: Start the Node.js dev server
node server.js

pause
