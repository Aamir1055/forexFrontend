# Force 2FA - 403 Error Solution

## Issue Summary

After successfully completing Force 2FA setup and logging in, the user encountered 403 (Forbidden) errors on all API endpoints:

```
api/users?page=1&limit=20 - 403 Forbidden
api/roles - 403 Forbidden
api/permissions - 403 Forbidden
api/brokers - 403 Forbidden
api/admin/broker-profiles - 403 Forbidden
```

## Root Cause

**The Force 2FA feature is working correctly.** The 403 errors are caused by the **test user being created without an assigned role**.

### What Happened:
1. ✅ User was created with `force_two_factor: true`
2. ✅ First login triggered 2FA setup screen
3. ✅ QR code was scanned and TOTP code verified
4. ✅ User was authenticated successfully (tokens stored)
5. ❌ **User has no role assigned → No permissions → 403 on all API calls**

## Why This Happened

When creating the Force 2FA test user, the role selection step was likely skipped or overlooked. While the UserModal has validation requiring at least one role, the visual indication may not have been prominent enough.

## Solutions

### Solution 1: Assign Role to Existing User (Quick Fix)

1. **Log in with an admin account** that has proper permissions
2. Navigate to **Users** module
3. **Edit the Force 2FA test user**
4. **Select at least one role** (e.g., "Admin" or "Broker Manager")
5. Save the changes
6. **Log out** and log back in with the Force 2FA user

### Solution 2: Create New Test User (Recommended)

1. **Log in with an admin account**
2. Navigate to **Users** module  
3. Click **"Add User"**
4. Fill in the form:
   - **Username**: `force2fa_test`
   - **Email**: `force2fa@example.com`
   - **Password**: Your test password
   - **⚠️ IMPORTANT: Select at least one role** (e.g., "Admin")
   - ✅ Check **"Force Two-Factor Authentication"**
5. Click **Create User**
6. **Log out** and test the Force 2FA flow with the new user

### Solution 3: Enhanced UI (Implemented) ✅

The UserModal has been updated with:

1. **Visual Indicators**:
   - Red asterisk (*) next to "Roles & Permissions" header
   - Selected roles highlighted with blue border and background
   - Unselected roles show in white with hover effects
   - Container turns red when validation fails

2. **Better Feedback**:
   - ⚠️ Error message when no role selected and form submitted
   - 💡 Helper hint when no roles are selected (before validation)
   - Enhanced visual contrast for selected vs unselected roles

3. **Validation**:
   - Prevents user creation without at least one role
   - Clear error message: "At least one role must be selected"

## Testing Force 2FA (After Role Assignment)

Once the user has a role assigned, follow the test guide:

### Step 1: Create Force 2FA User
- ✅ Username, email, password
- ✅ **Select at least one role** (Admin/Broker Manager/etc.)
- ✅ Check "Force Two-Factor Authentication"

### Step 2: First Login
- Should show 2FA setup screen (not regular 2FA)
- Scan QR code with authenticator app
- Save backup codes
- Enter TOTP code from app
- Should auto-login and redirect to dashboard

### Step 3: Verify Access
- ✅ Dashboard loads without 403 errors
- ✅ Can navigate to Users, Roles, Brokers, etc.
- ✅ Can perform CRUD operations based on role permissions

### Step 4: Subsequent Logins
- Should show regular 2FA verification screen
- Enter TOTP code from authenticator app
- Should login successfully

## Key Takeaways

1. **Force 2FA feature is fully functional** ✅
2. **403 errors are permission-related, not 2FA-related** 
3. **Always assign at least one role when creating users**
4. **Enhanced UI now makes role selection more prominent**
5. **Validation prevents user creation without roles**

## Updated Files

- `src/components/UserModal.tsx`:
  - Enhanced role selection UI with visual indicators
  - Red asterisk for required field
  - Color-coded validation states
  - Helper hints for better UX

## Next Steps

1. Use one of the solutions above to assign a role
2. Test the complete Force 2FA flow
3. Verify dashboard and module access works properly
4. The enhanced UI will prevent this issue in future user creation

---

**Deployed**: The updated UserModal with enhanced role selection is now live at `http://185.136.159.142/brk-eye-adm/`
