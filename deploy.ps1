# Automated Deployment Script for Broker Eye Admin Panel
# Builds the project and deploys to XAMPP htdocs

param(
    [switch]$SkipBuild,
    [switch]$Backup
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_DIR = $PSScriptRoot
$BUILD_DIR = Join-Path $PROJECT_DIR "dist"
$DEPLOY_DIR = "C:\xampp\htdocs\brk-eye-adm"
$BACKUP_DIR = "C:\xampp\htdocs\brk-eye-adm-backups"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Broker Eye Admin - Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $DEPLOY_DIR)) {
    Write-Host "WARNING: Deploy directory does not exist: $DEPLOY_DIR" -ForegroundColor Yellow
    Write-Host "Creating directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DEPLOY_DIR -Force | Out-Null
}

Write-Host "✓ Prerequisites OK" -ForegroundColor Green
Write-Host ""

# Build the project
if (-not $SkipBuild) {
    Write-Host "[2/6] Building project..." -ForegroundColor Yellow
    
    # Clean old build
    if (Test-Path $BUILD_DIR) {
        Write-Host "Cleaning old build..." -ForegroundColor Gray
        Remove-Item -Path $BUILD_DIR -Recurse -Force
    }
    
    # Run npm build
    Write-Host "Running: npm run build" -ForegroundColor Gray
    $buildOutput = npm run build 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed!" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "[2/6] Skipping build (using existing dist)" -ForegroundColor Yellow
}

# Verify build exists
if (-not (Test-Path $BUILD_DIR)) {
    Write-Host "ERROR: Build directory not found: $BUILD_DIR" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Backup existing deployment
if ($Backup -and (Test-Path $DEPLOY_DIR)) {
    Write-Host "[3/6] Creating backup..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupPath = Join-Path $BACKUP_DIR "backup_$timestamp"
    
    Write-Host "Backing up to: $backupPath" -ForegroundColor Gray
    Copy-Item -Path $DEPLOY_DIR -Destination $backupPath -Recurse -Force
    
    # Keep only last 5 backups
    $backups = Get-ChildItem -Path $BACKUP_DIR -Directory | Sort-Object CreationTime -Descending
    if ($backups.Count -gt 5) {
        $backups | Select-Object -Skip 5 | ForEach-Object {
            Write-Host "Removing old backup: $($_.Name)" -ForegroundColor Gray
            Remove-Item -Path $_.FullName -Recurse -Force
        }
    }
    
    Write-Host "✓ Backup created" -ForegroundColor Green
} else {
    Write-Host "[3/6] Skipping backup" -ForegroundColor Yellow
}

Write-Host ""

# Clear deployment directory
Write-Host "[4/6] Clearing deployment directory..." -ForegroundColor Yellow
if (Test-Path $DEPLOY_DIR) {
    Get-ChildItem -Path $DEPLOY_DIR -Recurse | Remove-Item -Force -Recurse
    Write-Host "✓ Deployment directory cleared" -ForegroundColor Green
} else {
    New-Item -ItemType Directory -Path $DEPLOY_DIR -Force | Out-Null
    Write-Host "✓ Deployment directory created" -ForegroundColor Green
}

Write-Host ""

# Deploy files
Write-Host "[5/6] Deploying files..." -ForegroundColor Yellow
Write-Host "Source: $BUILD_DIR" -ForegroundColor Gray
Write-Host "Target: $DEPLOY_DIR" -ForegroundColor Gray

Copy-Item -Path "$BUILD_DIR\*" -Destination $DEPLOY_DIR -Recurse -Force

# Verify deployment
$deployedFiles = Get-ChildItem -Path $DEPLOY_DIR -Recurse -File
Write-Host "✓ Deployed $($deployedFiles.Count) files" -ForegroundColor Green

Write-Host ""

# Summary
Write-Host "[6/6] Deployment Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Directory:  $BUILD_DIR" -ForegroundColor White
Write-Host "Deploy Directory: $DEPLOY_DIR" -ForegroundColor White
Write-Host "Files Deployed:   $($deployedFiles.Count)" -ForegroundColor White
if ($Backup) {
    Write-Host "Backup Created:   Yes" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Cyan
Write-Host "http://185.136.159.142/brk-eye-adm/" -ForegroundColor White
Write-Host ""
