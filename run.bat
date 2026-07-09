@echo off
title PAKTV Live - Local Dev Server
color 0A

echo.
echo  ============================================
echo   PAKTV Live - Starting Local Static Server
echo  ============================================
echo.

echo  [1/2] Starting server...
start "" /b timeout /t 2 >nul
start "" "http://localhost:3000"

:: Start a lightweight static server using npx
call npx -y serve@latest -l 3000

pause
