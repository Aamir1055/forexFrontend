@echo off
REM Auto-deployment watcher launcher

echo.
echo ========================================
echo   Auto-Deploy Watcher
echo ========================================
echo.
echo This will watch for file changes and
echo automatically deploy to XAMPP.
echo.
echo Press Ctrl+C to stop watching.
echo.
pause

REM Run PowerShell watcher script
powershell -ExecutionPolicy Bypass -File "%~dp0watch-deploy.ps1"

pause
