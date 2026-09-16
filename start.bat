@echo off
title Rasmaliiii Bot
color 0A

echo ========================================
echo   Rasmaliiii Bot - Starting Up...
echo ========================================
echo.

:: Automatically navigate to the folder this batch file is in
cd /d "%~dp0"

echo [1/2] Checking and syncing database...
call pnpm --filter @tensura/database db:push
if errorlevel 1 goto db_error

echo.
echo [2/2] Starting Rasmaliiii Bot...
echo (Press Ctrl+C to stop)
echo.
echo ========================================
echo   Bot is running! Check Discord :)
echo ========================================
echo.
call pnpm --filter @tensura/bot dev
if errorlevel 1 goto bot_error

goto end

:db_error
echo.
echo ========================================
echo   ERROR: Database sync failed!
echo ========================================
echo Please verify that DATABASE_URL in your .env file is correct.
echo.
pause
exit /b 1

:bot_error
echo.
echo ========================================
echo   ERROR: Bot execution stopped!
echo ========================================
echo Check the logs above for details.
echo.
pause
exit /b 1

:end
pause
