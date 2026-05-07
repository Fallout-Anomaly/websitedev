@echo off
echo ===================================================
echo   Fallen World Website - Dev Server Restart Script
echo ===================================================
echo.

echo [1/3] Forcefully stopping old Node.js and Next.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo Done.
echo.

echo [2/3] Starting Next.js development server...
:: Starts the webpack-based dev server in a new command prompt window so it stays open
start "Next.js Dev Server" cmd /k "npm run dev"

echo Waiting 5 seconds for the server to initialize...
timeout /t 5 /nobreak >nul
echo.

echo [3/3] Launching localhost:3000 in your default web browser...
start http://localhost:3000

echo.
echo All done! You can safely close this window.
