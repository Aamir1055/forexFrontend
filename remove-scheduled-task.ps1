# Remove the scheduled task

$taskName = "GitHub Auto Push - targetFxFrontend"

Write-Host "Removing scheduled task: $taskName" -ForegroundColor Yellow

try {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    
    if ($task) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "Task successfully removed!" -ForegroundColor Green
    } else {
        Write-Host "Task not found." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
