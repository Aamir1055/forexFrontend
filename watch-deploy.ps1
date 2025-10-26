# Auto-Deploy Watcher for Broker Eye Admin Panel
# Watches for file changes and automatically deploys to XAMPP

param(
    [switch]$NoBuild,
    [int]$DebounceSeconds = 2
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_DIR = $PSScriptRoot
$WATCH_PATHS = @(
    (Join-Path $PROJECT_DIR "src"),
    (Join-Path $PROJECT_DIR "public"),
    (Join-Path $PROJECT_DIR "index.html"),
    (Join-Path $PROJECT_DIR ".env.production")
)
$DEPLOY_SCRIPT = Join-Path $PROJECT_DIR "deploy.ps1"

# Colors
$COLOR_INFO = "Cyan"
$COLOR_SUCCESS = "Green"
$COLOR_WARNING = "Yellow"
$COLOR_ERROR = "Red"

Write-Host ""
Write-Host "========================================" -ForegroundColor $COLOR_INFO
Write-Host "  Auto-Deploy Watcher - ACTIVE" -ForegroundColor $COLOR_INFO
Write-Host "========================================" -ForegroundColor $COLOR_INFO
Write-Host ""
Write-Host "Watching directories:" -ForegroundColor $COLOR_WARNING
foreach ($path in $WATCH_PATHS) {
    if (Test-Path $path) {
        Write-Host "  ✓ $path" -ForegroundColor $COLOR_SUCCESS
    }
}
Write-Host ""
Write-Host "Debounce: $DebounceSeconds seconds" -ForegroundColor $COLOR_WARNING
Write-Host "Press Ctrl+C to stop watching" -ForegroundColor $COLOR_WARNING
Write-Host ""

# Track last deployment time
$script:lastDeployTime = [DateTime]::MinValue
$script:pendingDeploy = $false

# Function to trigger deployment
function Invoke-AutoDeploy {
    $now = Get-Date
    $timeSinceLastDeploy = ($now - $script:lastDeployTime).TotalSeconds
    
    # Debounce: only deploy if enough time has passed
    if ($timeSinceLastDeploy -lt $DebounceSeconds) {
        $script:pendingDeploy = $true
        return
    }
    
    $script:lastDeployTime = $now
    $script:pendingDeploy = $false
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $COLOR_INFO
    Write-Host "🔄 Changes detected - Starting deployment..." -ForegroundColor $COLOR_INFO
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $COLOR_INFO
    
    try {
        # Run deployment script
        & $DEPLOY_SCRIPT
        
        Write-Host ""
        Write-Host "✓ Auto-deployment completed!" -ForegroundColor $COLOR_SUCCESS
        Write-Host "Watching for more changes..." -ForegroundColor $COLOR_WARNING
        Write-Host ""
    }
    catch {
        Write-Host ""
        Write-Host "✗ Deployment failed: $($_.Exception.Message)" -ForegroundColor $COLOR_ERROR
        Write-Host "Continuing to watch for changes..." -ForegroundColor $COLOR_WARNING
        Write-Host ""
    }
}

# Create file system watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $PROJECT_DIR
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Filter to watch only relevant files
$watcher.Filter = "*.*"
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor 
                        [System.IO.NotifyFilters]::DirectoryName -bor
                        [System.IO.NotifyFilters]::LastWrite

# Event handler for file changes
$onChanged = {
    param($sender, $e)
    
    # Ignore certain paths
    $ignorePaths = @(
        "node_modules",
        ".git",
        "dist",
        ".vscode",
        "brk-eye-adm-backups"
    )
    
    $shouldIgnore = $false
    foreach ($ignore in $ignorePaths) {
        if ($e.FullPath -like "*\$ignore\*") {
            $shouldIgnore = $true
            break
        }
    }
    
    if ($shouldIgnore) {
        return
    }
    
    # Only watch specific file types
    $ext = [System.IO.Path]::GetExtension($e.FullPath)
    $watchExtensions = @(".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".json", ".env")
    
    if ($watchExtensions -notcontains $ext -and $e.Name -ne ".env.production") {
        return
    }
    
    $relativePath = $e.FullPath.Replace($PROJECT_DIR, "").TrimStart("\")
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Write-Host "[$timestamp] Changed: $relativePath" -ForegroundColor $COLOR_WARNING
    
    Invoke-AutoDeploy
}

# Register events
Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $onChanged | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Created -Action $onChanged | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $onChanged | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $onChanged | Out-Null

# Initial deployment
Write-Host "Running initial deployment..." -ForegroundColor $COLOR_INFO
Invoke-AutoDeploy

# Keep script running and check for pending deploys
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if we have a pending deploy
        if ($script:pendingDeploy) {
            $timeSinceLastDeploy = ((Get-Date) - $script:lastDeployTime).TotalSeconds
            if ($timeSinceLastDeploy -ge $DebounceSeconds) {
                Invoke-AutoDeploy
            }
        }
    }
}
finally {
    # Cleanup on exit
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Get-EventSubscriber | Unregister-Event
    Write-Host ""
    Write-Host "Watcher stopped." -ForegroundColor $COLOR_WARNING
}
