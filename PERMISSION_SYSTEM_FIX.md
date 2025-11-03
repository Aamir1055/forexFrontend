# Permission System Fix - Complete Guide

## 🎯 What Was Fixed

### Critical Issue Identified
The "Logs" page was getting **403 Forbidden** errors because:
1. **Two different menu items** ("Audit Logs" and "Logs") were both using `MODULES.AUDIT_LOGS` for permission checking
2. They hit **different backend APIs** requiring **different permissions**:
   - **Audit Logs** → `/api/audit-logs` (requires `audit.read` permission) ✅
   - **Logs** → `/api/logs/list` (requires `logs.view` permission) ❌

### Solution Implemented

#### 1. Created Separate Module for System/MT5 Logs
```typescript
// Added new module constant
export const MODULES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  BROKERS: 'brokers',
  ROLES: 'roles',
  GROUPS: 'groups',
  AUDIT_LOGS: 'audit_logs',  // For audit trail logs
  LOGS: 'logs',              // For system/MT5 logs (NEW!)
  PROFILE: 'profile',
}
```

#### 2. Added New Permissions
```typescript
// New permissions for System/MT5 logs
LOGS_VIEW: 'logs.view',
LOGS_READ: 'logs.read',
```

#### 3. Updated Sidebar Navigation
```typescript
// Changed from MODULES.AUDIT_LOGS to MODULES.LOGS
{ name: 'Logs', href: '/logs', icon: FileSpreadsheet, module: MODULES.LOGS }
```

#### 4. Added 403 Error Handling to Logs Page
- Shows user-friendly "Access Denied" UI
- Explains that they need `logs.view` permission
- Provides "Go Back" button

#### 5. Cleaned Up Console Logs
- Removed excessive debug logging from:
  - `src/utils/permissions.ts`
  - `src/contexts/PermissionContext.tsx`
  - `src/components/Sidebar.tsx`
- Console is now clean and professional

---

## 🔧 What Backend Needs to Do

The backend needs to add `logs.view` permission to roles that should access System/MT5 logs.

### Required Backend Permissions Mapping

| Frontend Module | Backend Permission Required | Current Status |
|----------------|---------------------------|---------------|
| Dashboard | `analytics.view` | ✅ Working |
| Users | `users.view` | ✅ Working |
| Roles | `roles.view` | ✅ Working |
| Brokers | `broker.profile.view` | ✅ Working |
| Groups | `client.view` | ✅ Working |
| **Audit Logs** | `audit.read` | ✅ Working |
| **Logs (System/MT5)** | `logs.view` or `logs.read` | ❌ **MISSING** |
| Profile/Settings | `portfolio.view` | ✅ Working |

### Backend Action Required

Your "Test" role currently has these 19 permissions:
```
analytics.view
broker.profile.create
broker.profile.view
client.create
client.view
market.view
mt5.account.view
mt5.deals.view
mt5.user.view
portfolio.edit
portfolio.view
reports.generate
roles.create
roles.view
audit.read          ← For Audit Logs page
trade.create
trade.view
users.create
users.view
```

**Add this permission to the "Test" role:**
```
logs.view           ← For System/MT5 Logs page
```

Or alternatively:
```
logs.read
```

---

## 🧪 How to Test

### Test 1: Logs Page Access Denied (Current State)
1. Refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Click on **"Logs"** in sidebar
3. **Expected**: See "Access Denied" message with red warning icon
4. **Reason**: User doesn't have `logs.view` permission

### Test 2: After Backend Adds Permission
1. Backend admin adds `logs.view` to "Test" role
2. Logout and login again (to refresh token with new permissions)
3. Click on **"Logs"** in sidebar
4. **Expected**: See log file list and content viewer
5. Should be able to:
   - Switch between System and MT5 tabs
   - Select log files from dropdown
   - Search log content
   - View paginated logs

---

## 📊 Current Permission Status

### Modules Visible to "Test" Role (✅ = Working)

| Module | Permission | Status | Notes |
|--------|-----------|--------|-------|
| Dashboard | `analytics.view` | ✅ | Working |
| Users | `users.view` | ✅ | Can view, create |
| Roles | `roles.view` | ✅ | Can view, create |
| Brokers | `broker.profile.view` | ✅ | Can view, create |
| Broker Profiles | `broker.profile.view` | ✅ | Same as Brokers |
| Groups | `client.view` | ✅ | Can view, create |
| Audit Logs | `audit.read` | ✅ | Working perfectly |
| **Logs** | `logs.view` | ❌ | **403 Forbidden** |
| Settings | `portfolio.view` | ✅ | Working |

---

## 🚀 Next Steps for Complete RBAC Implementation

### ✅ Completed Tasks
- [x] Permission utilities created (`src/utils/permissions.ts`)
- [x] PermissionContext with dynamic role fetching
- [x] PermissionGate component for conditional rendering
- [x] Sidebar permission filtering
- [x] Users module permission gates
- [x] Brokers module permission gates
- [x] Roles module permission gates
- [x] 403 error handling for all modules
- [x] Permission naming aligned with backend
- [x] Separate LOGS module created
- [x] Debug logs cleaned up

### 📋 Remaining Tasks

1. **Apply Permission Gates to Groups Module**
   - Wrap Create/Edit/Delete buttons in `<PermissionGate>`
   - Use permissions: `client.view`, `client.create`, `client.edit`, `client.delete`

2. **Apply Permission Gates to Broker Profiles Module**
   - Same as Brokers (uses `broker.profile.*` permissions)

3. **Apply Permission Gates to Settings/Profile Module**
   - Use permissions: `portfolio.view`, `portfolio.edit`

4. **Test with Different User Roles**
   - Create test user with only "view" permissions (no create/edit/delete)
   - Verify action buttons are hidden
   - Create test user with limited module access
   - Verify sidebar only shows allowed modules

5. **Remove Debug Logs** (if any remain)
   - Check console for excessive logging
   - Keep only error logs

6. **Document Permission Requirements**
   - Create matrix of all modules and their required permissions
   - Share with backend team

---

## 📝 Summary

### What Changed in This Session

1. **Created separate LOGS module** (different from AUDIT_LOGS)
2. **Added LOGS_VIEW permission** to permission constants
3. **Updated Sidebar** to use MODULES.LOGS for "Logs" menu item
4. **Added 403 error handling** to Logs page
5. **Removed all debug console.logs** for clean console output
6. **Updated permission check** to look for `logs.view` instead of `audit.read`

### Current State

- ✅ All 9 sidebar items show correctly (permission checks working)
- ✅ "Audit Logs" page works (has `audit.read` permission)
- ❌ "Logs" page shows 403 error (missing `logs.view` permission)
- ✅ Console is clean (no excessive logging)

### What Backend Must Do

**Add `logs.view` permission to the "Test" role (or any role that should access System/MT5 logs)**

Then the "Logs" page will work perfectly, just like "Audit Logs" does.

---

## 🔍 Debugging Tips

If you still see issues after backend adds the permission:

1. **Check browser console** for 403 errors
2. **Logout and login again** (to get fresh token with new permissions)
3. **Clear browser cache** and hard refresh
4. **Verify token payload** in browser DevTools > Application > Local Storage
5. **Check Network tab** to see actual API response from backend

---

## 📞 Support

If you encounter any issues:
1. Check console errors
2. Verify backend added `logs.view` permission
3. Confirm user logged out and back in
4. Share console errors if problem persists
