import React, { ReactNode } from 'react'
import { usePermissions } from '../contexts/PermissionContext'

interface PermissionGateProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  module?: string
  action?: 'view' | 'create' | 'edit' | 'delete'
  fallback?: ReactNode
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 * 
 * Usage Examples:
 * 
 * 1. Check single permission:
 *    <PermissionGate permission="users.create">
 *      <CreateUserButton />
 *    </PermissionGate>
 * 
 * 2. Check multiple permissions (any):
 *    <PermissionGate permissions={["users.edit", "users.delete"]}>
 *      <EditButton />
 *    </PermissionGate>
 * 
 * 3. Check multiple permissions (all required):
 *    <PermissionGate permissions={["users.edit", "users.delete"]} requireAll>
 *      <AdminPanel />
 *    </PermissionGate>
 * 
 * 4. Check by module and action:
 *    <PermissionGate module="users" action="create">
 *      <CreateButton />
 *    </PermissionGate>
 * 
 * 5. With fallback content:
 *    <PermissionGate permission="users.view" fallback={<AccessDenied />}>
 *      <UserList />
 *    </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  module,
  action,
  fallback = null
}) => {
  const permissionContext = usePermissions()

  // If user is admin, grant access to everything immediately
  if (permissionContext.isAdmin) {
    return <>{children}</>
  }

  let hasAccess = false

  // Check by module and action
  if (module && action) {
    switch (action) {
      case 'view':
        hasAccess = permissionContext.canViewModule(module)
        break
      case 'create':
        hasAccess = permissionContext.canCreate(module)
        break
      case 'edit':
        hasAccess = permissionContext.canEdit(module)
        break
      case 'delete':
        hasAccess = permissionContext.canDelete(module)
        break
    }
  }
  // Check single permission
  else if (permission) {
    hasAccess = permissionContext.hasPermission(permission)
  }
  // Check multiple permissions
  else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? permissionContext.hasAllPermissions(permissions)
      : permissionContext.hasAnyPermission(permissions)
  }
  // If no permission check specified, allow access
  else {
    hasAccess = true
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * Hook version for conditional logic in components
 */
export const usePermissionCheck = () => {
  const permissionContext = usePermissions()

  const checkAccess = (props: Omit<PermissionGateProps, 'children' | 'fallback'>): boolean => {
    const { permission, permissions, requireAll = false, module, action } = props

    let hasAccess = false

    if (module && action) {
      switch (action) {
        case 'view':
          hasAccess = permissionContext.canViewModule(module)
          break
        case 'create':
          hasAccess = permissionContext.canCreate(module)
          break
        case 'edit':
          hasAccess = permissionContext.canEdit(module)
          break
        case 'delete':
          hasAccess = permissionContext.canDelete(module)
          break
      }
    } else if (permission) {
      hasAccess = permissionContext.hasPermission(permission)
    } else if (permissions && permissions.length > 0) {
      hasAccess = requireAll
        ? permissionContext.hasAllPermissions(permissions)
        : permissionContext.hasAnyPermission(permissions)
    } else {
      hasAccess = true
    }

    // If user is admin, grant access to everything
    if (permissionContext.isAdmin) {
      hasAccess = true
    }

    return hasAccess
  }

  return {
    checkAccess,
    ...permissionContext
  }
}
