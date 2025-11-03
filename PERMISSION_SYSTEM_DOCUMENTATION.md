# Permission-Based Access Control Implementation

## Overview
Implemented comprehensive Role-Based Access Control (RBAC) system that conditionally renders UI elements based on user permissions.

## System Architecture

### 1. Core Permission Utilities (`src/utils/permissions.ts`)
- **Permission Constants**: Defined all permission names (e.g., `users.view`, `users.create`, `users.edit`, `users.delete`)
- **Module Constants**: Defined module names (dashboard, users, brokers, roles, groups, audit_logs, profile)
- **Helper Functions**:
  - `getCurrentUser()` - Get logged-in user from localStorage
  - `getUserPermissions(user)` - Extract all permissions from user's roles
  - `hasPermission(permissionName)` - Check if user has specific permission
  - `hasAnyPermission(permissionNames[])` - Check if user has any of the permissions
  - `hasAllPermissions(permissionNames[])` - Check if user has all permissions
  - `canViewModule(module)` - Check if user can access a module
  - `canCreate(module)` - Check if user can create in a module
  - `canEdit(module)` - Check if user can edit in a module
  - `canDelete(module)` - Check if user can delete in a module
  - `isAdmin(user)` - Check if user has admin role
  - `debugPermissions()` - Console log user permissions for debugging

### 2. Permission Context (`src/contexts/PermissionContext.tsx`)
- **PermissionProvider**: React context provider that wraps the app
- **usePermissions()**: Hook to access permission data and functions
- **Features**:
  - Listens to `auth:updated` events to refresh permissions
  - Provides user object and permissions array
  - Provides all permission check functions
  - Auto-refreshes on authentication changes

### 3. Permission Gate Component (`src/components/PermissionGate.tsx`)
- **PermissionGate**: Reusable component for conditional rendering
- **Props**:
  - `permission`: Single permission to check
  - `permissions`: Multiple permissions to check
  - `requireAll`: If true, requires all permissions; if false, requires any
  - `module`: Module name to check
  - `action`: Action type ('view', 'create', 'edit', 'delete')
  - `fallback`: Component to show if access denied
- **usePermissionCheck()**: Hook version for programmatic checks

## Implementation Details

### Permission Name Format
Backend permissions follow this naming convention:
```
<module>.<action>

Examples:
- users.view
- users.create
- users.edit
- users.delete
- brokers.view
- brokers.create
- roles.edit
- audit_logs.export
```

### User Data Structure
The system expects user data with this structure:
```typescript
{
  id: number
  username: string
  email: string
  roles: [
    {
      id: number
      name: string
      permissions: [
        {
          id: number
          name: string  // e.g., "users.create"
          description: string
          category: string
        }
      ]
    }
  ]
}
```

## Applied Permissions

### 1. App Structure (`src/App.tsx`)
- Wrapped entire app with `PermissionProvider`
- All routes now have access to permission context

### 2. Sidebar Navigation (`src/components/Sidebar.tsx`)
- **Filtered Menu Items**: Only shows modules user has access to
- **Dynamic Navigation**: Menu items automatically hide/show based on permissions
- **Admin Bypass**: Admin users see all menu items

### 3. Users Module (`src/pages/Users.tsx` & `src/components/UserTable.tsx`)
- **Create Button**: Hidden if user lacks `users.create` permission
- **Edit Buttons**: Hidden if user lacks `users.edit` permission
- **Delete Buttons**: Hidden if user lacks `users.delete` permission
- **Module Access**: Entire module hidden if user lacks `users.view` permission

### 4. Brokers Module (`src/pages/Brokers.tsx` & `src/components/BrokerTable.tsx`)
- **Create Button**: Hidden if user lacks `brokers.create` permission
- **Edit Buttons**: Hidden if user lacks `brokers.edit` permission
- **Delete Buttons**: Hidden if user lacks `brokers.delete` permission
- **Module Access**: Entire module hidden if user lacks `brokers.view` permission

## Usage Examples

### Example 1: Hide Create Button
```tsx
import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'

<PermissionGate module={MODULES.USERS} action="create">
  <button onClick={handleCreateUser}>
    Create User
  </button>
</PermissionGate>
```

### Example 2: Check Single Permission
```tsx
<PermissionGate permission="users.delete">
  <button onClick={handleDelete}>Delete</button>
</PermissionGate>
```

### Example 3: Check Multiple Permissions (Any)
```tsx
<PermissionGate permissions={["users.edit", "users.delete"]}>
  <AdminActions />
</PermissionGate>
```

### Example 4: Check Multiple Permissions (All Required)
```tsx
<PermissionGate permissions={["users.edit", "users.delete"]} requireAll>
  <AdvancedSettings />
</PermissionGate>
```

### Example 5: With Fallback Content
```tsx
<PermissionGate 
  module={MODULES.USERS} 
  action="view"
  fallback={<AccessDenied />}
>
  <UserList />
</PermissionGate>
```

### Example 6: Programmatic Check
```tsx
import { usePermissionCheck } from '../components/PermissionGate'

const MyComponent = () => {
  const { checkAccess, isAdmin } = usePermissionCheck()
  
  const canEdit = checkAccess({ module: MODULES.USERS, action: 'edit' })
  
  return (
    <div>
      {isAdmin && <AdminPanel />}
      {canEdit && <EditButton />}
    </div>
  )
}
```

## Backend Requirements

For this system to work correctly, the backend must:

1. **Return User with Roles and Permissions**: 
   - Login response must include user object with roles array
   - Each role must include permissions array
   - Permissions must have a `name` field with format `module.action`

2. **Permission Names**: 
   - Must match the constants defined in `src/utils/permissions.ts`
   - Format: `<module>.<action>` (e.g., `users.create`)

3. **Store User Data**: 
   - Frontend stores user data in localStorage as `user`
   - Data persists across page refreshes
   - Clears on logout

## Testing Permissions

### Debug Function
```javascript
// In browser console or component
import { debugPermissions } from '../utils/permissions'
debugPermissions()

// Output:
// 🔐 User Permissions Debug
//   User: john.doe
//   Roles: Admin, Editor
//   Permissions: ["users.view", "users.create", "users.edit", "brokers.view", ...]
//   Accessible Modules: ["dashboard", "users", "brokers", "roles"]
//   Is Admin: true
```

### Test Scenarios
1. **Admin User**: Should see all modules and all buttons
2. **View-Only User**: Should see modules but no create/edit/delete buttons
3. **Limited Access User**: Should only see specific modules they have access to
4. **No Permissions**: Should see empty sidebar and access denied messages

## Next Steps to Complete

### Remaining Modules (Quick Implementation)
Apply the same pattern to:
1. **Roles Module** - Add permission checks for create/edit/delete role buttons
2. **Groups Module** - Add permission checks for create/edit/delete group buttons
3. **Audit Logs Module** - Check `audit_logs.view` and `audit_logs.export` permissions
4. **Profile/Settings** - Check `profile.view` and `profile.edit` permissions

### Example for Roles Module
```tsx
// In src/pages/Roles.tsx
import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'

// Wrap create button
<PermissionGate module={MODULES.ROLES} action="create">
  <button onClick={handleCreateRole}>Create Role</button>
</PermissionGate>

// In RoleTable component
<PermissionGate module={MODULES.ROLES} action="edit">
  <button onClick={() => onEdit(role)}>Edit</button>
</PermissionGate>

<PermissionGate module={MODULES.ROLES} action="delete">
  <button onClick={() => onDelete(role.id)}>Delete</button>
</PermissionGate>
```

## Admin Bypass

Users with roles containing "admin" or "super" in the name automatically:
- See all modules in sidebar
- See all action buttons
- Bypass all permission checks

This ensures admins always have full access.

## Benefits

1. **Security**: UI elements hidden for unauthorized users
2. **User Experience**: Cleaner interface - users only see what they can use
3. **Maintainable**: Centralized permission logic in utility functions
4. **Scalable**: Easy to add new permissions and modules
5. **Consistent**: Same pattern across all modules
6. **Type-Safe**: TypeScript interfaces for permissions
7. **Flexible**: Multiple ways to check permissions (component, hook, or utility)

## Important Notes

1. **Client-Side Only**: This is UI-level security only. Backend must still enforce permissions via API
2. **Token Management**: Permission data refreshes when `auth:updated` event fires
3. **LocalStorage**: User data persists in localStorage between page refreshes
4. **Real-Time Updates**: Permissions update when user logs in/out or roles change
5. **Performance**: Permission checks are fast (array lookups) and don't impact performance
