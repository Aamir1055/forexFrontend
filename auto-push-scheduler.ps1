# Auto Push Scheduler - Runs every 1 hour
# This script monitors for changes and auto-pushes to GitHub hourly

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GitHub Auto Push Scheduler Started" -ForegroundColor Cyan
Write-Host "  Checking for changes every 1 hour" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the scheduler" -ForegroundColor Yellow
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$autoPushScript = Join-Path $scriptPath "auto-push.ps1"

# Interval in seconds (1 hour = 3600 seconds)
$interval = 3600

$runCount = 0

while ($true) {
    $runCount++
    
    Write-Host "================================================" -ForegroundColor Gray
    Write-Host "Run #$runCount - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "================================================" -ForegroundColor Gray
    Write-Host ""
    
    # Execute the auto-push script
    try {
        & PowerShell.exe -ExecutionPolicy Bypass -File $autoPushScript
    } catch {
        Write-Host "Error executing auto-push script: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Next check in 1 hour at $(Get-Date).AddHours(1).ToString('yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "Waiting..." -ForegroundColor Gray
    Write-Host ""
    
    # Wait for 1 hour
    Start-Sleep -Seconds $interval
}
