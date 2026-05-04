import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { User, Role } from '../types'
import { userService } from '../services/userService'
import { useAuth } from './AuthContext'
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
 isLoading: boolean
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
 const { initialized, token } = useAuth()
 const location = useLocation()
 const [user, setUser] = useState<User | null>(null)
 const [permissions, setPermissions] = useState<string[]>([])
 const [accessibleModules, setAccessibleModules] = useState<string[]>([])
 const [isLoadingPermissions, setIsLoadingPermissions] = useState(true)

 // Fetch current user with permissions from /api/auth/me
 const fetchUserPermissions = async () => {
 const authToken = localStorage.getItem('authToken')
 
 if (!authToken) {
 setUser(null)
 setPermissions([])
 setAccessibleModules([])
 setIsLoadingPermissions(false)
 return
 }

	// Show loading state on every fetch so ModuleRoute shows a spinner
	// instead of AccessDenied while fresh permissions are in-flight.
	setIsLoadingPermissions(true)

 try {
 const response = await userService.getCurrentUser()
 // Handle both { data: {...} } and flat { id, permissions, ... } API shapes
 const data = response.data ?? response

 // Map the auth/me response shape to the User type
 const userData = {
 id: data.id,
 username: data.username,
 email: data.email,
 is_active: data.is_active,
 permissions: Array.isArray(data.permissions) ? data.permissions : [],
 // Map string roles array to Role objects for compatibility
 roles: Array.isArray(data.roles)
 ? data.roles.map((r: string) => ({ id: 0, name: r, description: '', created_at: '', updated_at: '' }))
 : [],
 } as any

 localStorage.setItem('user', JSON.stringify(userData))
 localStorage.setItem('authUser', JSON.stringify({ username: data.username, email: data.email }))

 setUser(userData)

 // Permissions come as a flat string array directly from the API
 const allPermissions: string[] = Array.isArray(data.permissions) ? data.permissions : []

 console.log('✅ Loaded user permissions from /api/auth/me:', allPermissions)
 setPermissions(allPermissions)
 setAccessibleModules(fetchAccessibleModules(userData))
 setIsLoadingPermissions(false)
 } catch (error) {
 console.error('❌ Failed to fetch user permissions:', error)
 // Do NOT clear permissions on transient network errors — keep existing state.
 setIsLoadingPermissions(false)
 }
 }

 // Load user permissions after auth initialization, on token changes,
 // and on route/tab changes so /api/auth/me is called when navigating.
 useEffect(() => {
 if (!initialized) {
 setIsLoadingPermissions(true)
 return
 }

 fetchUserPermissions()
 }, [initialized, token, location.pathname])

 // Listen for auth updates (login/logout/refresh)
 useEffect(() => {
 const handleAuthUpdate = () => {
 fetchUserPermissions()
 }

 window.addEventListener('auth:updated', handleAuthUpdate)
 window.addEventListener('token:refreshed', handleAuthUpdate)
 return () => {
 window.removeEventListener('auth:updated', handleAuthUpdate)
 window.removeEventListener('token:refreshed', handleAuthUpdate)
 }
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
 return checkCanViewModule(module, user)
 }

 const canCreate = (module: string): boolean => {
 return checkCanCreate(module, user)
 }

 const canEdit = (module: string): boolean => {
 return checkCanEdit(module, user)
 }

 const canDelete = (module: string): boolean => {
 return checkCanDelete(module, user)
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
 isLoading: isLoadingPermissions,
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

