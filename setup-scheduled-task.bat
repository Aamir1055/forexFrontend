@echo off
REM Setup Windows Task Scheduler (Run as Administrator)
echo ================================================
echo   Setting up GitHub Auto Push Task
echo ================================================
echo.
echo This will create a Windows Task that runs every 1 hour.
echo.
echo Please ensure this is running as Administrator!
echo.
pause

PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0setup-scheduled-task.ps1"

echo.
pause
