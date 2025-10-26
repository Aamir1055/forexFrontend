# GitHub Auto Push Scripts

Automated scripts to push code changes to GitHub every 1 hour.

## 📁 Scripts Overview

### 1. **auto-push.ps1** / **auto-push.bat**
- Checks for changes in the repository
- If changes exist, commits and pushes to GitHub
- Creates commit with timestamp: "Auto-commit: YYYY-MM-DD HH:MM:SS"
- **Usage**: Run once to push current changes

### 2. **auto-push-scheduler.ps1** / **auto-push-scheduler.bat**
- Runs the auto-push script every 1 hour in a loop
- Keeps running continuously in the terminal
- Shows countdown until next check
- **Usage**: Keep this terminal window open

### 3. **setup-scheduled-task.ps1** / **setup-scheduled-task.bat**
- Creates a Windows Task Scheduler task
- Runs auto-push every 1 hour in the background
- Doesn't require keeping a terminal open
- **Recommended**: Use this for production

### 4. **remove-scheduled-task.ps1**
- Removes the scheduled task from Windows Task Scheduler

---

## 🚀 Quick Start

### Option A: Manual Push (One-time)
```bash
# Using npm
npm run push

# Or double-click
auto-push.bat
```

### Option B: Continuous Loop (Terminal must stay open)
```bash
# Using npm
npm run push:schedule

# Or double-click
auto-push-scheduler.bat
```

### Option C: Windows Task Scheduler (Recommended - Runs in background)
```bash
# Using npm (Run as Administrator)
npm run push:setup

# Or right-click and "Run as Administrator"
setup-scheduled-task.bat
```

---

## 📋 NPM Scripts

Add these to your workflow:

```bash
# Push changes once
npm run push

# Start hourly scheduler (terminal loop)
npm run push:schedule

# Setup Windows Task Scheduler (run as admin)
npm run push:setup

# Remove scheduled task
npm run push:remove
```

---

## ⚙️ How It Works

### Auto Push Logic:
1. **Check for changes**: Uses `git status --porcelain`
2. **If no changes**: Exits without doing anything
3. **If changes found**:
   - Adds all changes: `git add .`
   - Creates commit: `git commit -m "Auto-commit: [timestamp]"`
   - Pushes to GitHub: `git push origin master`

### Scheduled Task:
- **Trigger**: Repeats every 1 hour (3600 seconds)
- **Start**: Immediately after setup
- **Runs**: Even if PC is locked (requires network)
- **Logs**: Check Task Scheduler for execution history

---

## 🛠️ Setup Windows Task Scheduler

### Steps:
1. **Run as Administrator**: Right-click `setup-scheduled-task.bat` → "Run as administrator"
2. The script will:
   - Create a task named "GitHub Auto Push - targetFxFrontend"
   - Set it to run every 1 hour
   - Start immediately
3. Verify in Task Scheduler (`taskschd.msc`)

### View Task:
1. Press `Win + R`
2. Type `taskschd.msc` and press Enter
3. Look for "GitHub Auto Push - targetFxFrontend" in the Task Scheduler Library

### Remove Task:
```bash
npm run push:remove
# Or run: remove-scheduled-task.ps1
```

---

## 📊 What Gets Pushed

### Automatically commits:
- All modified files
- New files
- Deleted files
- Build artifacts (if in git)

### Commit Message Format:
```
Auto-commit: 2025-10-27 14:30:00
```

---

## 🔧 Troubleshooting

### Issue: "Permission denied (publickey)"
**Solution**: Script already uses HTTPS. Make sure you can manually push:
```bash
git push origin master
```

### Issue: Task doesn't run
**Solutions**:
1. Check Task Scheduler is running
2. Verify task exists in `taskschd.msc`
3. Check "Last Run Result" in task properties
4. Ensure network is available

### Issue: "Execution Policy" error
**Solution**: Scripts use `-ExecutionPolicy Bypass`, but if it fails:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📝 File Locations

All scripts are in the project root:
```
targetFxFrontend/
├── auto-push.ps1                    # Main push script
├── auto-push.bat                    # Batch wrapper
├── auto-push-scheduler.ps1          # Hourly loop script
├── auto-push-scheduler.bat          # Batch wrapper
├── setup-scheduled-task.ps1         # Task setup
├── setup-scheduled-task.bat         # Batch wrapper
├── remove-scheduled-task.ps1        # Task removal
└── AUTO_PUSH_SCRIPTS.md            # This file
```

---

## ⏰ Schedule Customization

To change the interval, edit the scripts:

### For scheduler loop (`auto-push-scheduler.ps1`):
```powershell
# Change this line (seconds)
$interval = 3600  # 1 hour = 3600 seconds
# 30 minutes = 1800
# 2 hours = 7200
```

### For Windows Task:
Re-run setup with modified interval, or manually edit in Task Scheduler.

---

## 🎯 Best Practices

1. **Use Task Scheduler for production** - Runs even when you're not logged in
2. **Test manual push first** - Run `npm run push` to verify it works
3. **Check Task history** - Review in Task Scheduler regularly
4. **Don't commit sensitive data** - Add to `.gitignore` first
5. **Monitor GitHub Actions** - If you have CI/CD that runs on push

---

## 🔐 Security Notes

- Scripts use HTTPS for GitHub (username/password or token required)
- Commits are made with your current git config user
- Task runs with your Windows user privileges
- No credentials are stored in the scripts

---

## ✅ Verification

After setup, verify it's working:

1. Make a small change to any file
2. Wait up to 1 hour
3. Check GitHub repository for auto-commit
4. Check Task Scheduler history

---

## 📞 Support

If you encounter issues:
1. Check the console output for errors
2. Verify git credentials work manually
3. Check Windows Event Viewer for task errors
4. Ensure you have network connectivity

---

**Created**: October 27, 2025
**Project**: targetFxFrontend
**Repository**: https://github.com/Aamir1055/forexFrontend.git
