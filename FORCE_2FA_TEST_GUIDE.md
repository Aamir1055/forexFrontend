# Force 2FA Feature - Testing Guide

## Test URL
http://185.136.159.142/brk-eye-adm/

## Complete Test Flow

### Step 1: Create User with Force 2FA
1. Login as admin
2. Go to **Users** module
3. Click **"New User"** button
4. Fill in the form:
   - Username: `testuser2fa`
   - Email: `test2fa@example.com`
   - Password: `Test123!`
   - ✅ **Check "Force Two-Factor Authentication"**
   - ✅ Check "User is active"
5. Click **Save**
6. Verify user is created successfully

### Step 2: Logout
1. Click logout button
2. Should redirect to login page

### Step 3: Test Force 2FA Setup Flow
1. On login page, enter:
   - Username: `testuser2fa`
   - Password: `Test123!`
2. Click **Sign In**

**Expected:** Should see 2FA Setup screen (NOT normal login)

### Step 4: Complete 2FA Setup
On the 2FA Setup screen, you should see:
- ✅ QR Code image
- ✅ Secret key (manual entry option)
- ✅ 10 Backup codes
- ✅ Copy backup codes button
- ✅ Verification code input (6 digits)

**Actions:**
1. Open Google Authenticator or Authy app on your phone
2. Scan the QR code
3. OR manually enter the secret key shown
4. Enter the 6-digit code from your authenticator app
5. Click **Verify & Enable 2FA**

**Expected Result:** 
- Toast message: "2FA setup complete! Logging you in..."
- Auto-redirect to dashboard
- User is now logged in

### Step 5: Test Subsequent Login (After 2FA Enabled)
1. Logout
2. Login again with same credentials
3. **Expected:** Now should see regular 2FA verification screen (not setup)
4. Enter 6-digit code from authenticator
5. Should login successfully

## API Endpoints Being Used

### 1. Create User
```
POST http://185.136.159.142:8080/api/users
{
  "username": "testuser2fa",
  "email": "test2fa@example.com",
  "password": "Test123!",
  "is_active": true,
  "force_two_factor": true
}
```

### 2. Login (First Time)
```
POST http://185.136.159.142:8080/api/auth/login
{
  "username": "testuser2fa",
  "password": "Test123!"
}

Response:
{
  "data": {
    "requires_2fa_setup": true,
    "temp_token": "...",
    "message": "2FA is required for your account. Please complete setup."
  }
}
```

### 3. Setup 2FA with Temp Token
```
POST http://185.136.159.142:8080/api/auth/2fa/setup-temp
{
  "temp_token": "..."
}

Response:
{
  "data": {
    "qr_code_uri": "otpauth://...",
    "secret": "...",
    "backup_codes": ["...", "...", ...]
  }
}
```

### 4. Enable 2FA with Temp Token
```
POST http://185.136.159.142:8080/api/auth/2fa/enable-temp
{
  "temp_token": "...",
  "code": "123456",
  "backup_codes": [...]
}

Response:
{
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {...}
  }
}
```

## Verification Checklist

- [ ] User creation with force_two_factor works
- [ ] Login shows 2FA setup screen (not normal login)
- [ ] QR code is displayed correctly
- [ ] Secret key is shown for manual entry
- [ ] Backup codes are displayed (10 codes)
- [ ] Copy backup codes button works
- [ ] Can enter 6-digit verification code
- [ ] Successful verification enables 2FA and logs in
- [ ] Subsequent logins require 2FA code (not setup)
- [ ] User can login with backup code if needed

## Expected Console Logs

During login with Force 2FA user:
```
=== LOGIN PAGE: Submit started ===
=== LOGIN PAGE: Login result === {requires_2fa: true, requires_2fa_setup: true, temp_token: "..."}
```

During 2FA setup:
```
Setting up 2FA with temp token...
QR code received: otpauth://...
```

During verification:
```
Enabling 2FA with temp token and code...
✅ Token refreshed successfully (auto-login)
```

## Testing Status

**Build:** ✅ Completed successfully
**Deployment:** ✅ Deployed to XAMPP
**Ready for Testing:** ✅ Yes

Navigate to: http://185.136.159.142/brk-eye-adm/
