@echo off
REM Auto Push Scheduler - Runs every 1 hour
echo ================================================
echo   GitHub Auto Push Scheduler
echo   Checking for changes every 1 hour
echo ================================================
echo.
echo This window will run continuously.
echo Press Ctrl+C to stop the scheduler.
echo.

PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0auto-push-scheduler.ps1"
