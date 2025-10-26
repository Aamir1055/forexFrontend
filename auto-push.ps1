# Auto Push to GitHub Script
# This script checks for changes and pushes to GitHub if any exist

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Auto Push to GitHub - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if there are any changes
Write-Host "Checking for changes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain

if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Host "No changes detected. Nothing to push." -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "Changes detected!" -ForegroundColor Cyan
Write-Host ""

# Show what's changed
Write-Host "Modified files:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Add all changes
Write-Host "Adding all changes to staging..." -ForegroundColor Yellow
git add .

# Create commit message with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Auto-commit: $timestamp"

Write-Host "Creating commit..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful!" -ForegroundColor Green
    Write-Host ""
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "  Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Failed to push to GitHub!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Failed to create commit!" -ForegroundColor Red
    exit 1
}

Write-Host ""
