# Setup Windows Task Scheduler for Auto Push
# This creates a scheduled task that runs every 1 hour

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setting up Windows Task Scheduler" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$autoPushScript = Join-Path $scriptPath "auto-push.ps1"

# Task details
$taskName = "GitHub Auto Push - targetFxFrontend"
$taskDescription = "Automatically push code changes to GitHub every hour"

Write-Host "Task Name: $taskName" -ForegroundColor Yellow
Write-Host "Script Path: $autoPushScript" -ForegroundColor Yellow
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Task already exists. Removing old task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Old task removed." -ForegroundColor Green
    Write-Host ""
}

# Create the action
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$autoPushScript`""

# Create the trigger (runs every 1 hour, starting now)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration ([TimeSpan]::MaxValue)

# Create the principal (run with highest privileges)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

# Create the settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Register the task
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $taskDescription
    
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Task successfully created!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  - Name: $taskName" -ForegroundColor White
    Write-Host "  - Runs every: 1 hour" -ForegroundColor White
    Write-Host "  - First run: Immediately" -ForegroundColor White
    Write-Host "  - Script: $autoPushScript" -ForegroundColor White
    Write-Host ""
    Write-Host "To view the task:" -ForegroundColor Yellow
    Write-Host "  1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "  2. Look for '$taskName'" -ForegroundColor White
    Write-Host ""
    Write-Host "To remove the task, run:" -ForegroundColor Yellow
    Write-Host "  .\remove-scheduled-task.ps1" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "Failed to create scheduled task!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run this script as Administrator." -ForegroundColor Yellow
    exit 1
}
