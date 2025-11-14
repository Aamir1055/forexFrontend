import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Role } from '../types'
import { userService } from '../services/userService'
import { 
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  canViewModule as checkCanViewModule,
  canCreate as checkCanCreate,
  canEdit as checkCanEdit,
  canDelete as checkCanDelete,
  isAdmin as checkIsAdmin,
  getAccessibleModules as fetchAccessibleModules
} from '../utils/permissions'

interface PermissionContextType {
  user: User | null
  permissions: string[]
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  canViewModule: (module: string) => boolean
  canCreate: (module: string) => boolean
  canEdit: (module: string) => boolean
  canDelete: (module: string) => boolean
  isAdmin: boolean
  accessibleModules: string[]
  refreshPermissions: () => void
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

// Export PermissionContext for testing
export { PermissionContext }

export const usePermissions = () => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}

interface PermissionProviderProps {
  children: ReactNode
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [accessibleModules, setAccessibleModules] = useState<string[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)

  // Fetch current user with permissions from /api/users/me
  const fetchUserPermissions = async () => {
    const token = localStorage.getItem('authToken')
    
    if (!token) {
      setUser(null)
      setPermissions([])
      setAccessibleModules([])
      setIsLoadingPermissions(false)
      return
    }

    try {
      const response = await userService.getCurrentUser()
      const userData = response.data.user
      
      setUser(userData)
      
      // Extract all permissions from all roles
      const allPermissions: string[] = []
      if (userData.roles && Array.isArray(userData.roles)) {
        userData.roles.forEach(role => {
          if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach(perm => {
              if (perm.name && !allPermissions.includes(perm.name)) {
                allPermissions.push(perm.name)
              }
            })
          }
        })
      }
      
      console.log('✅ Loaded user permissions from /api/users/me:', allPermissions)
      setPermissions(allPermissions)
      setAccessibleModules(fetchAccessibleModules())
      setIsLoadingPermissions(false)
    } catch (error) {
      console.error('❌ Failed to fetch user permissions:', error)
      setUser(null)
      setPermissions([])
      setAccessibleModules([])
      setIsLoadingPermissions(false)
    }
  }

  // Load user permissions on mount
  useEffect(() => {
    fetchUserPermissions()
  }, [])

  // Listen for auth updates (login/logout)
  useEffect(() => {
    const handleAuthUpdate = () => {
      fetchUserPermissions()
    }

    window.addEventListener('auth:updated', handleAuthUpdate)
    return () => window.removeEventListener('auth:updated', handleAuthUpdate)
  }, [])

  const hasPermission = (permission: string): boolean => {
    return checkPermission(permission, user)
  }

  const hasAnyPermission = (perms: string[]): boolean => {
    return checkAnyPermission(perms, user)
  }

  const hasAllPermissions = (perms: string[]): boolean => {
    return checkAllPermissions(perms, user)
  }

  const canViewModule = (module: string): boolean => {
    return checkCanViewModule(module)
  }

  const canCreate = (module: string): boolean => {
    return checkCanCreate(module)
  }

  const canEdit = (module: string): boolean => {
    return checkCanEdit(module)
  }

  const canDelete = (module: string): boolean => {
    return checkCanDelete(module)
  }

  const isAdmin = checkIsAdmin(user)

  const refreshPermissions = async () => {
    await fetchUserPermissions()
  }

  return (
    <PermissionContext.Provider
      value={{
        user,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canViewModule,
        canCreate,
        canEdit,
        canDelete,
        isAdmin,
        accessibleModules,
        refreshPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  )
}

