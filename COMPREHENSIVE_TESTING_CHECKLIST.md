# Comprehensive Application Testing Checklist
## Forex Trading Platform - Frontend Testing Guide

**Date:** October 24, 2025  
**Application:** Forex Trading Management System  
**Test Environment:** http://localhost:3000  

---

## 📋 PRE-TEST SETUP

### ✅ Environment Check
- [ ] Development server is running (`npm run dev`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Backend API is accessible
- [ ] Browser developer console is open (F12)
- [ ] Network tab is monitoring requests

### ✅ Test Credentials
```
Default Admin User:
- Username: [Your admin username]
- Password: [Your admin password]
```

---

## 🔐 AUTHENTICATION MODULE

### Login Functionality
- [ ] **TC-01:** Navigate to `/login` - Login page loads
- [ ] **TC-02:** Submit empty form - Validation errors appear
- [ ] **TC-03:** Enter invalid credentials - Error message displayed
- [ ] **TC-04:** Enter valid credentials - Login successful
- [ ] **TC-05:** Check "Remember Me" - Session persists on refresh
- [ ] **TC-06:** Password visibility toggle - Works correctly
- [ ] **TC-07:** After login - Redirected to Dashboard

### Two-Factor Authentication (2FA)
- [ ] **TC-08:** 2FA enabled user login - 2FA prompt appears
- [ ] **TC-09:** Enter invalid 2FA code - Error displayed
- [ ] **TC-10:** Enter valid 2FA code - Login successful
- [ ] **TC-11:** 2FA backup codes - Can be used for login
- [ ] **TC-12:** QR code generation - Displays properly

### Logout
- [ ] **TC-13:** Click logout button - User logged out
- [ ] **TC-14:** After logout - Redirected to login page
- [ ] **TC-15:** Try accessing protected route - Redirected to login

---

## 📊 DASHBOARD MODULE

### Page Load & UI
- [ ] **TC-16:** Dashboard loads - All widgets visible
- [ ] **TC-17:** Statistics cards - Display correct data
- [ ] **TC-18:** Charts render - No console errors
- [ ] **TC-19:** Recent activity - Shows latest activities
- [ ] **TC-20:** User activity chart - Data displays correctly
- [ ] **TC-21:** System performance chart - Renders properly

### Quick Actions Panel ⭐ (RECENTLY FIXED)
- [ ] **TC-22:** "Add New Broker" button - Opens broker modal
- [ ] **TC-23:** "Create Group" button - Opens group modal
- [ ] **TC-24:** "Manage Roles" button - Navigates to roles page
- [ ] **TC-25:** "System Settings" button - Navigates to settings page
- [ ] **TC-26:** Header "New Broker" button - Opens broker modal
- [ ] **TC-27:** Click actions - Console logs visible (F12)
- [ ] **TC-28:** Modal opening - Smooth animation

### Charts & Data Visualization
- [ ] **TC-29:** Hover over chart elements - Tooltips appear
- [ ] **TC-30:** Chart time range selector - Updates data
- [ ] **TC-31:** System health indicator - Shows correct status

---

## 👥 USERS MODULE

### User List & Search
- [ ] **TC-32:** Navigate to Users page - Table loads
- [ ] **TC-33:** Search by username - Results filter correctly
- [ ] **TC-34:** Search by email - Results filter correctly
- [ ] **TC-35:** Clear search - All users displayed
- [ ] **TC-36:** Pagination - Works correctly
- [ ] **TC-37:** Items per page selector - Updates view

### Create User
- [ ] **TC-38:** Click "Add User" - Modal opens
- [ ] **TC-39:** Submit empty form - Validation errors
- [ ] **TC-40:** Enter invalid email - Email validation error
- [ ] **TC-41:** Password mismatch - Validation error
- [ ] **TC-42:** Create valid user - Success toast
- [ ] **TC-43:** New user appears - In user list
- [ ] **TC-44:** Form reset - After successful creation

### Edit User
- [ ] **TC-45:** Click edit icon - Modal opens with data
- [ ] **TC-46:** Update username - Changes saved
- [ ] **TC-47:** Update email - Changes saved
- [ ] **TC-48:** Change password - Password updated
- [ ] **TC-49:** Update roles - Role assignment works
- [ ] **TC-50:** Cancel edit - No changes saved

### Delete User
- [ ] **TC-51:** Click delete icon - Confirmation dialog
- [ ] **TC-52:** Cancel delete - User not deleted
- [ ] **TC-53:** Confirm delete - User removed
- [ ] **TC-54:** Delete success - Toast notification
- [ ] **TC-55:** User removed - From list immediately

### User Status Toggle
- [ ] **TC-56:** Toggle active status - Status updates
- [ ] **TC-57:** Inactive user - Cannot login
- [ ] **TC-58:** Reactivate user - Can login again

---

## 🏢 BROKERS MODULE

### Broker List & Filters
- [ ] **TC-59:** Navigate to Brokers - Table loads
- [ ] **TC-60:** Search brokers - Filters correctly
- [ ] **TC-61:** Filter by status - Active/Inactive works
- [ ] **TC-62:** Sort by column - Sorting works
- [ ] **TC-63:** Pagination - Navigates correctly

### Create Broker ⭐ (RECENTLY UPDATED)
- [ ] **TC-64:** Click "Add Broker" - Modal opens
- [ ] **TC-65:** Tab navigation - All 4 tabs accessible
  - Basic Information
  - Permissions
  - Profiles
  - Account Mapping
- [ ] **TC-66:** Basic Info tab - All fields present
  - Username
  - Full Name
  - Email
  - Phone
  - Password (for new broker)
  - Account Range From/To
  - Credit Limit
  - Default Percentage
  - Match All Condition
  - Active checkbox
- [ ] **TC-67:** Submit basic info - Broker created
- [ ] **TC-68:** Form validation - All required fields

### Broker Permissions
- [ ] **TC-69:** Permissions tab - Rights list loads
- [ ] **TC-70:** Select rights - Checkboxes work
- [ ] **TC-71:** Category selection - Works correctly
- [ ] **TC-72:** Apply permissions - Saved successfully

### Broker Profiles
- [ ] **TC-73:** Profiles tab - Profile list loads
- [ ] **TC-74:** Select profile - Rights auto-selected
- [ ] **TC-75:** Profile groups subtab - Groups display
- [ ] **TC-76:** Apply profile - Assigns correctly

### Account Mapping ⭐ (CRITICAL FEATURE)
- [ ] **TC-77:** Account Mapping tab - Form visible
- [ ] **TC-78:** Field name dropdown - Shows MT5 fields
- [ ] **TC-79:** Operator selection - All operators available
  - = (Equals)
  - LIKE
  - STARTS_WITH
  - CONTAINS
  - ENDS_WITH
  - NOT_CONTAINS
- [ ] **TC-80:** Field value input - Accepts text
- [ ] **TC-81:** Add mapping - Appears in pending list
- [ ] **TC-82:** Multiple mappings - Can add multiple
- [ ] **TC-83:** Remove mapping - Removes from list
- [ ] **TC-84:** Save broker with mappings - All saved
- [ ] **TC-85:** Match All Condition toggle - Works correctly
- [ ] **TC-86:** MT5 suggestions - Auto-complete works

### Edit Broker
- [ ] **TC-87:** Click edit - Modal opens with data
- [ ] **TC-88:** Update basic info - Saves correctly
- [ ] **TC-89:** Update permissions - Changes saved
- [ ] **TC-90:** Update account mappings - Changes saved
- [ ] **TC-91:** Edit existing mapping - Updates correctly

### Delete Broker
- [ ] **TC-92:** Click delete - Confirmation dialog
- [ ] **TC-93:** Confirm delete - Broker removed
- [ ] **TC-94:** Associated data - Mappings also deleted

### Broker Rights Management
- [ ] **TC-95:** Navigate to Broker Rights - Page loads
- [ ] **TC-96:** Select broker - Rights modal opens
- [ ] **TC-97:** View current rights - Displays correctly
- [ ] **TC-98:** Add rights - Rights assigned
- [ ] **TC-99:** Remove rights - Rights revoked
- [ ] **TC-100:** Category filtering - Works correctly

---

## 📁 BROKER PROFILES MODULE

### Profile Management
- [ ] **TC-101:** Navigate to Broker Profiles - Loads
- [ ] **TC-102:** Create new profile - Modal opens
- [ ] **TC-103:** Profile name & description - Required
- [ ] **TC-104:** Select rights - Multiple selection works
- [ ] **TC-105:** Select groups - Multiple selection works
- [ ] **TC-106:** Save profile - Created successfully
- [ ] **TC-107:** Edit profile - Updates correctly
- [ ] **TC-108:** Delete profile - Removes profile
- [ ] **TC-109:** Search profiles - Filters results

---

## 👥 GROUPS MODULE

### Group Management
- [ ] **TC-110:** Navigate to Groups - Table loads
- [ ] **TC-111:** Create group - Modal opens
- [ ] **TC-112:** Group name required - Validation works
- [ ] **TC-113:** Group description - Optional field
- [ ] **TC-114:** Save group - Created successfully
- [ ] **TC-115:** Edit group - Updates correctly
- [ ] **TC-116:** Delete group - Confirmation dialog
- [ ] **TC-117:** Search groups - Filters correctly
- [ ] **TC-118:** Pagination - Works correctly

---

## 🛡️ ROLES MODULE

### Role Management
- [ ] **TC-119:** Navigate to Roles - Table loads
- [ ] **TC-120:** Create role - Modal opens
- [ ] **TC-121:** Role name required - Validation works
- [ ] **TC-122:** Select permissions - By category
- [ ] **TC-123:** Permission categories - All visible
- [ ] **TC-124:** Select all in category - Works
- [ ] **TC-125:** Deselect all - Clears selection
- [ ] **TC-126:** Save role - Created successfully
- [ ] **TC-127:** Edit role - Updates correctly
- [ ] **TC-128:** Delete role - Removes role
- [ ] **TC-129:** Assign role to user - Works correctly

---

## 📜 AUDIT LOGS MODULE

### Audit Log Viewing
- [ ] **TC-130:** Navigate to Audit Logs - Table loads
- [ ] **TC-131:** Filter by action - Filters correctly
- [ ] **TC-132:** Filter by user - Shows user actions
- [ ] **TC-133:** Filter by date - Date range works
- [ ] **TC-134:** View log details - Shows full info
- [ ] **TC-135:** Export logs - Download works
- [ ] **TC-136:** Pagination - Navigates correctly
- [ ] **TC-137:** Search - Finds specific logs

---

## 📝 LOGS MODULE

### System & MT5 Logs
- [ ] **TC-138:** Navigate to Logs - Page loads
- [ ] **TC-139:** System logs tab - Displays logs
- [ ] **TC-140:** MT5 logs tab - Displays logs
- [ ] **TC-141:** Select log file - Content displays
- [ ] **TC-142:** Search in logs - Highlights results
- [ ] **TC-143:** Download log file - Works correctly
- [ ] **TC-144:** Refresh logs - Updates content
- [ ] **TC-145:** File size display - Shows correctly

---

## ⚙️ SETTINGS MODULE

### Profile Settings
- [ ] **TC-146:** Navigate to Settings - Page loads
- [ ] **TC-147:** View profile info - Displays correctly
- [ ] **TC-148:** Update profile - Saves changes
- [ ] **TC-149:** Change password - Updates password
- [ ] **TC-150:** Enable 2FA - QR code shown
- [ ] **TC-151:** Disable 2FA - Requires password
- [ ] **TC-152:** Backup codes - Generated correctly

### System Settings
- [ ] **TC-153:** System configuration - Displays
- [ ] **TC-154:** Update settings - Saves correctly
- [ ] **TC-155:** MT5 connection - Test connection works

---

## 🧭 NAVIGATION & UI

### Sidebar Navigation
- [ ] **TC-156:** Sidebar menu - All items visible
- [ ] **TC-157:** Click menu items - Navigate correctly
- [ ] **TC-158:** Active page highlight - Shows correctly
- [ ] **TC-159:** Sidebar responsive - Mobile view works
- [ ] **TC-160:** Menu icons - Display properly

### Top Navigation
- [ ] **TC-161:** User profile dropdown - Opens
- [ ] **TC-162:** Notifications - Display correctly
- [ ] **TC-163:** Settings link - Navigates correctly
- [ ] **TC-164:** Logout button - Works correctly

### Responsive Design
- [ ] **TC-165:** Desktop view (1920px) - Displays properly
- [ ] **TC-166:** Tablet view (768px) - Responsive
- [ ] **TC-167:** Mobile view (375px) - Usable
- [ ] **TC-168:** Tables - Scroll horizontally on mobile
- [ ] **TC-169:** Modals - Fit screen on mobile

---

## 🔔 NOTIFICATIONS & TOASTS

### Toast Notifications
- [ ] **TC-170:** Success toast - Green color, proper message
- [ ] **TC-171:** Error toast - Red color, error message
- [ ] **TC-172:** Info toast - Blue color, info message
- [ ] **TC-173:** Toast auto-dismiss - Closes after 4s
- [ ] **TC-174:** Toast manual close - X button works
- [ ] **TC-175:** Multiple toasts - Stack properly

---

## 🎨 UI/UX ELEMENTS

### Modals
- [ ] **TC-176:** Modal open animation - Smooth
- [ ] **TC-177:** Modal close - X button works
- [ ] **TC-178:** Modal close - Click outside works
- [ ] **TC-179:** Modal close - ESC key works
- [ ] **TC-180:** Modal overlay - Blocks background
- [ ] **TC-181:** Multiple modals - Z-index correct

### Forms
- [ ] **TC-182:** Required field validation - Shows errors
- [ ] **TC-183:** Email validation - Format check
- [ ] **TC-184:** Number inputs - Accept numbers only
- [ ] **TC-185:** Dropdowns - Options selectable
- [ ] **TC-186:** Checkboxes - Toggle correctly
- [ ] **TC-187:** Radio buttons - Single selection
- [ ] **TC-188:** Form reset - Clears all fields

### Tables
- [ ] **TC-189:** Table headers - Display correctly
- [ ] **TC-190:** Table sorting - Click headers
- [ ] **TC-191:** Row hover - Highlight effect
- [ ] **TC-192:** Action buttons - Visible on hover
- [ ] **TC-193:** Empty state - Shows message
- [ ] **TC-194:** Loading state - Shows spinner

### Buttons
- [ ] **TC-195:** Primary buttons - Blue background
- [ ] **TC-196:** Secondary buttons - Gray background
- [ ] **TC-197:** Danger buttons - Red background
- [ ] **TC-198:** Disabled buttons - Grayed out
- [ ] **TC-199:** Button hover - Color change
- [ ] **TC-200:** Button loading - Shows spinner

---

## 🔌 API INTEGRATION

### API Requests
- [ ] **TC-201:** All GET requests - Return 200
- [ ] **TC-202:** All POST requests - Return 201
- [ ] **TC-203:** All PUT requests - Return 200
- [ ] **TC-204:** All DELETE requests - Return 200/204
- [ ] **TC-205:** 401 Unauthorized - Redirect to login
- [ ] **TC-206:** 403 Forbidden - Show error message
- [ ] **TC-207:** 404 Not Found - Handle gracefully
- [ ] **TC-208:** 500 Server Error - Show error toast
- [ ] **TC-209:** Network error - Show retry option
- [ ] **TC-210:** Request timeout - Handle gracefully

### Authentication & Headers
- [ ] **TC-211:** Auth token - Included in requests
- [ ] **TC-212:** Token refresh - Automatic refresh
- [ ] **TC-213:** Token expiry - Logout user
- [ ] **TC-214:** Content-Type headers - Set correctly
- [ ] **TC-215:** CORS - No CORS errors

---

## 🐛 ERROR HANDLING

### Error Scenarios
- [ ] **TC-216:** Network offline - Error message
- [ ] **TC-217:** API down - Graceful error
- [ ] **TC-218:** Invalid form data - Validation errors
- [ ] **TC-219:** Duplicate entry - Conflict error
- [ ] **TC-220:** Permission denied - Access denied message
- [ ] **TC-221:** Session expired - Redirect to login
- [ ] **TC-222:** Invalid route - 404 page
- [ ] **TC-223:** Console errors - No unexpected errors

---

## ⚡ PERFORMANCE

### Page Load
- [ ] **TC-224:** Initial load < 3 seconds
- [ ] **TC-225:** Subsequent loads < 1 second
- [ ] **TC-226:** API responses < 500ms
- [ ] **TC-227:** No memory leaks - Check DevTools
- [ ] **TC-228:** Images optimized - Load quickly
- [ ] **TC-229:** Lazy loading - Works for routes

---

## 🔒 SECURITY

### Security Checks
- [ ] **TC-230:** Protected routes - Require auth
- [ ] **TC-231:** Password fields - Masked
- [ ] **TC-232:** XSS prevention - Input sanitized
- [ ] **TC-233:** SQL injection - Prevented
- [ ] **TC-234:** Session storage - Secure
- [ ] **TC-235:** Logout - Clears all data

---

## 📱 BROWSER COMPATIBILITY

### Browsers to Test
- [ ] **TC-236:** Chrome (latest) - Fully functional
- [ ] **TC-237:** Firefox (latest) - Fully functional
- [ ] **TC-238:** Safari (latest) - Fully functional
- [ ] **TC-239:** Edge (latest) - Fully functional
- [ ] **TC-240:** Mobile Chrome - Responsive

---

## 🎯 CRITICAL USER FLOWS

### End-to-End Workflows
- [ ] **Flow-1:** Complete Broker Creation
  1. Login
  2. Navigate to Brokers
  3. Click Add Broker
  4. Fill basic info
  5. Add permissions
  6. Add account mappings
  7. Save broker
  8. Verify in broker list

- [ ] **Flow-2:** User Management
  1. Create new user
  2. Assign roles
  3. Activate user
  4. Login as new user
  5. Test permissions

- [ ] **Flow-3:** Profile & Group Workflow
  1. Create broker profile
  2. Add rights to profile
  3. Create group
  4. Create broker using profile
  5. Verify broker has correct rights

---

## 📊 TEST RESULTS SUMMARY

### Results Template
```
Total Test Cases: 243
Passed: ___
Failed: ___
Blocked: ___
Not Tested: ___

Pass Rate: ___%
```

### Failed Test Cases (To be filled during testing)
```
TC-ID | Description | Error/Issue | Severity | Screenshot
------|-------------|-------------|----------|------------
      |             |             |          |
      |             |             |          |
```

### Known Issues
```
1. 
2. 
3. 
```

### Browser-Specific Issues
```
Chrome: 
Firefox: 
Safari: 
Edge: 
```

---

## 🚀 POST-TEST ACTIONS

### If All Tests Pass
- [ ] Build production version
- [ ] Verify production build
- [ ] Performance audit
- [ ] Security audit
- [ ] Deploy to staging

### If Tests Fail
- [ ] Document all failures
- [ ] Create bug tickets
- [ ] Assign priorities
- [ ] Retest after fixes
- [ ] Update test cases

---

## 📝 NOTES

### Testing Environment
- Backend API URL: `http://185.136.159.142:8080`
- Frontend URL: `http://localhost:3000` (dev) or `http://localhost:3001` (alternate)
- Node Version: ___
- NPM Version: ___

### Special Test Data
```
Test Broker: [broker details]
Test User: [user details]
Test Group: [group details]
Test Account Mappings: [mapping examples]
```

---

## ✅ SIGN-OFF

**Tested By:** ___________________  
**Date:** ___________________  
**Build Version:** ___________________  
**Overall Status:** [ ] PASS / [ ] FAIL  
**Ready for Deployment:** [ ] YES / [ ] NO  

**Comments:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

---

**END OF TEST CHECKLIST**
