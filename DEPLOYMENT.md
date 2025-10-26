# Broker Eye Admin - Deployment Scripts

This folder contains automated deployment scripts to build and deploy your application to XAMPP.

## 🚀 Quick Start

### Option 1: Auto-Deploy Watcher (BEST for Development)
Automatically builds and deploys whenever you save changes:

```bash
# Start the watcher
npm run watch:deploy

# OR double-click
watch-deploy.bat
```

The watcher will:
- Monitor `src/`, `public/`, `index.html`, `.env.production`
- Automatically build and deploy when you save any file
- Show real-time deployment status
- Continue running until you press Ctrl+C

### Option 2: Double-click deployment
1. Double-click `deploy.bat`
2. Wait for build and deployment to complete
3. Access: http://185.136.159.142/brk-eye-adm/

### Option 3: Manual NPM Commands
```bash
# Full build and deploy
npm run deploy

# Deploy with backup
npm run deploy:backup

# Deploy without rebuilding (use existing dist)
npm run deploy:quick
```

## 📋 What the Script Does

1. ✅ Checks prerequisites (npm, directories)
2. ✅ Builds the project (`npm run build`)
3. ✅ Optionally backs up current deployment
4. ✅ Clears deployment directory
5. ✅ Copies new build files to XAMPP
6. ✅ Shows deployment summary

## 📁 Directories

- **Project:** `C:\Users\Administrator\Desktop\targetFxFrontend`
- **Build Output:** `dist/`
- **Deployment:** `C:\xampp\htdocs\brk-eye-adm`
- **Backups:** `C:\xampp\htdocs\brk-eye-adm-backups`

## 🛠️ Script Options

### -Backup
Creates a timestamped backup before deploying. Keeps last 5 backups.

```powershell
.\deploy.ps1 -Backup
```

### -SkipBuild
Skips the build step and deploys existing dist folder.

```powershell
.\deploy.ps1 -SkipBuild
```

### Combined
```powershell
.\deploy.ps1 -Backup -SkipBuild
```

## 🔧 Troubleshooting

### "Execution policy" error
If you get a PowerShell execution policy error, run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Or use the `.bat` file instead.

### Build fails
- Ensure all dependencies are installed: `npm install`
- Check for syntax errors: `npm run build`

### Deployment directory not found
The script will create it automatically. Ensure XAMPP is installed.

## 📝 Customization

Edit `deploy.ps1` to change:
- `$DEPLOY_DIR`: Deployment target
- `$BACKUP_DIR`: Backup location
- Backup retention count (default: 5)

## 🎯 Production URL

After deployment, access your app at:
**http://185.136.159.142/brk-eye-adm/**

## ⚡ Quick Commands

```bash
# Standard deploy
npm run deploy

# OR use PowerShell directly
.\deploy.ps1

# OR use batch file
deploy.bat
```

## 📦 What Gets Deployed

All files from `dist/` including:
- `index.html`
- `assets/` (JS, CSS, images)
- `.htaccess` (if present)

The script preserves the exact structure needed for the SPA to work correctly.
