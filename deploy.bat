@echo off
REM Windows Batch deployment script for Broker Eye Admin Panel
REM Simple wrapper for PowerShell script

echo.
echo ========================================
echo   Broker Eye Admin - Quick Deploy
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found!
    pause
    exit /b 1
)

REM Run PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)

echo.
echo Press any key to exit...
pause >nul
