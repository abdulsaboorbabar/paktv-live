@echo off
title PAKTV Live - Deploy to Surge
color 0B

echo.
echo  ============================================
echo   PAKTV Live - Deploying to Surge.sh (HTTP)
echo  ============================================
echo.
echo  This will upload your static files to Surge.sh so you can play
echo  both HTTP and HTTPS streams.
echo.
echo  * If this is your first time, Surge will ask you to enter an
echo    email and a new password to create a free account.
echo  * When it asks for "project", just press ENTER.
echo  * You can type your own domain name (e.g. paktv-live.surge.sh).
echo.
pause
echo.

:: Trigger surge deployment using npx
call npx surge

echo.
echo  ============================================
echo   Deployment completed!
echo  ============================================
echo.
pause
