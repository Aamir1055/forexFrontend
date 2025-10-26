@echo off
REM Auto Push to GitHub - Batch Script Wrapper
echo ================================================
echo   Auto Push to GitHub - Starting...
echo ================================================
echo.

PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0auto-push.ps1"

echo.
echo Press any key to exit...
pause >nul
