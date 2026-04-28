import React, { createContext, useContext, useState, useEffect } from 'react'
import { buildApiUrl } from '../lib/apiBase'
import { authService } from '../services/authService'

interface AuthContextType {
 isAuthenticated: boolean
 user: { username: string; email: string } | null
 login: (username: string, password: string) => Promise<boolean | 'requires_2fa'>
 verify2FA: (username: string, password: string, totpCode: string) => Promise<boolean>
 logout: () => void
 token: string | null
 initialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Export AuthContext for testing
export { AuthContext }

export const useAuth = () => {
 const context = useContext(AuthContext)
 if (!context) {
 throw new Error('useAuth must be used within an AuthProvider')
 }
 return context
}

interface AuthProviderProps {
 children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
 const [isAuthenticated, setIsAuthenticated] = useState(false)
 const [user, setUser] = useState<{ username: string; email: string } | null>(null)
 const [token, setToken] = useState<string | null>(null)
 const [initialized, setInitialized] = useState(false)

 const syncUserFromStorage = () => {
 const savedUser = localStorage.getItem('user') || localStorage.getItem('authUser')

 if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
 try {
 const userData = JSON.parse(savedUser)
 setUser(userData)
 } catch (error) {
 console.error('Error parsing saved user data:', error)
 localStorage.removeItem('user')
 localStorage.removeItem('authUser')
 setUser(null)
 }
 } else {
 setUser(null)
 }
 }

 const syncAuthState = async () => {
 const savedToken = localStorage.getItem('authToken')
 const savedRefreshToken = localStorage.getItem('refreshToken')

 if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
 setToken(savedToken)
 setIsAuthenticated(true)
 syncUserFromStorage()
 return true
 }

 if (savedRefreshToken && savedRefreshToken !== 'undefined' && savedRefreshToken !== 'null') {
 try {
 console.log('🔄 Access token missing, attempting immediate refresh from AuthContext')
 const refreshed = await authService.refreshToken()
 setToken(refreshed.access_token)
 setIsAuthenticated(true)
 syncUserFromStorage()
 return true
 } catch (error) {
 console.error('❌ Startup/session refresh failed in AuthContext:', error)
 setToken(null)
 setIsAuthenticated(false)
 syncUserFromStorage()
 return false
 }
 }

 setToken(null)
 setIsAuthenticated(false)
 syncUserFromStorage()
 return false
 }

 useEffect(() => {
 // Check for existing auth on mount
 const checkAndRefreshAuth = async () => {
 await syncAuthState()
 setInitialized(true)
 }

 checkAndRefreshAuth()
 }, [])

 // Listen for explicit auth updates (after login/2FA) and storage changes
 useEffect(() => {
 const handler = async () => {
 const savedToken = localStorage.getItem('authToken')
 const savedRefreshToken = localStorage.getItem('refreshToken')

 // Only update state if token exists
 if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
 setToken(savedToken)
 setIsAuthenticated(true)
 } else if (savedToken === null && savedRefreshToken === null) {
 // Only logout if BOTH tokens are removed - this means user logged out or refresh failed
 console.log('🔒 Both tokens removed, logging out and redirecting')
 setToken(null)
 setIsAuthenticated(false)
 
 // Redirect to login page
 const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
 const base = envBase && envBase.trim().length > 0
 ? envBase
 : `${window.location.protocol}//${window.location.host}/brk-eye-adm`
 const normalized = base.endsWith('/') ? base : `${base}/`
 const absoluteUrl = `${normalized}login`
 
 // Use replace to prevent back navigation to protected pages
 window.location.replace(absoluteUrl)
 } else if ((savedToken === null || savedToken === 'undefined' || savedToken === 'null') && savedRefreshToken) {
 await syncAuthState()
 } else {
 setToken(null)
 setIsAuthenticated(false)
 }

 syncUserFromStorage()

 setInitialized(true)
 }

 const tokenRefreshedListener = (event: Event) => {
 const customEvent = event as CustomEvent<{ token?: string }>
 const nextToken = customEvent.detail?.token || localStorage.getItem('authToken')
 if (nextToken) {
 setToken(nextToken)
 setIsAuthenticated(true)
 syncUserFromStorage()
 }
 }

 const storageListener = (e: StorageEvent) => {
 // Only react to storage changes from other tabs/windows
 // Don't react to programmatic changes in the same tab (the API interceptor handles that)
 if (e.key && ['authToken', 'user', 'authUser', 'refreshToken'].includes(e.key)) {
 handler()
 }
 }

 window.addEventListener('auth:updated', handler as EventListener)
 window.addEventListener('token:refreshed', tokenRefreshedListener as EventListener)
 window.addEventListener('storage', storageListener)
 return () => {
 window.removeEventListener('auth:updated', handler as EventListener)
 window.removeEventListener('token:refreshed', tokenRefreshedListener as EventListener)
 window.removeEventListener('storage', storageListener)
 }
 }, [])

 const login = async (username: string, password: string): Promise<boolean | 'requires_2fa'> => {
 try {
 // Build API URL from centralized helper
 const apiUrl = buildApiUrl('/api/auth/login')
 
 console.log('Attempting login to:', apiUrl)
 console.log('Credentials:', { username, password: '***' })
 
 const response = await fetch(apiUrl, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ username, password }),
 })

 console.log('Response status:', response.status)
 
 // Try to parse JSON response
 let data;
 try {
 data = await response.json()
 console.log('Login response:', data)
 } catch (parseError) {
 console.error('Failed to parse response:', parseError)
 // If JSON parsing fails, throw based on status code
 if (!response.ok) {
 if (response.status === 401) {
 throw new Error('Invalid username or password')
 } else if (response.status === 403) {
 throw new Error('Account is disabled or locked')
 } else if (response.status === 500) {
 throw new Error('Server error. Please try again later')
 } else {
 throw new Error('Login failed. Please try again')
 }
 }
 throw new Error('Invalid server response')
 }
 
 // Check for error status in response body
 if (data.status === 'error') {
 console.error('Login error from server:', data.message)
 throw new Error(data.message || 'Invalid username or password')
 }
 
 // Check HTTP status for errors
 if (!response.ok) {
 console.error('HTTP error:', response.status, response.statusText)
 
 if (response.status === 401) {
 throw new Error(data.message || 'Invalid username or password')
 } else if (response.status === 403) {
 throw new Error(data.message || 'Account is disabled or locked')
 } else if (response.status === 500) {
 throw new Error('Server error. Please try again later')
 } else {
 throw new Error(data.message || 'Login failed. Please try again')
 }
 }

 // Handle 2FA requirement
 if (data.status === 'success' && data.data?.requires_2fa) {
 console.log('2FA required')
 return 'requires_2fa'
 }

 // Handle successful login
 if (data.status === 'success' && data.data?.access_token) {
 console.log('Login successful!')
 const token = data.data.access_token
 const refreshToken = data.data.refresh_token
 const userData = data.data.user
 
 setToken(token)
 setUser({ username: userData.username, email: userData.email })
 setIsAuthenticated(true)
 
 localStorage.setItem('authToken', token)
 if (refreshToken) {
 localStorage.setItem('refreshToken', refreshToken)
 console.log('✅ Refresh token stored in AuthContext')
 } else {
 console.warn('⚠️ No refresh token in login response')
 }
 localStorage.setItem('user', JSON.stringify(userData))
 localStorage.setItem('authUser', JSON.stringify({ username: userData.username, email: userData.email }))
 
 return true
 }

 console.log('Unexpected response format:', data)
 throw new Error('Invalid username or password')
 } catch (error) {
 console.error('Login error caught:', error)
 // Re-throw to allow the component to handle it
 throw error
 }
 }

 const verify2FA = async (username: string, password: string, totpCode: string): Promise<boolean> => {
 try {
 const apiUrl = buildApiUrl('/api/auth/verify-2fa')
 
 const response = await fetch(apiUrl, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ username, password, totp_code: totpCode }),
 })

 if (!response.ok) {
 return false
 }

 const data = await response.json()

 if (data.status === 'success' && data.data?.access_token) {
 const token = data.data.access_token
 const refreshToken = data.data.refresh_token
 const userData = data.data.user

 localStorage.setItem('authToken', token)
 if (refreshToken) {
 localStorage.setItem('refreshToken', refreshToken)
 console.log('✅ 2FA Refresh token stored')
 } else {
 console.warn('⚠️ No refresh token in 2FA response')
 }
 localStorage.setItem('user', JSON.stringify(userData))
 localStorage.setItem('authUser', JSON.stringify(userData))
 
 setToken(token)
 setUser(userData)
 setIsAuthenticated(true)
 
 return true
 }

 return false
 } catch (error) {
 console.error('2FA verification error:', error)
 return false
 }
 }

 const logout = () => {
 setToken(null)
 setUser(null)
 setIsAuthenticated(false)
 
 localStorage.removeItem('authToken')
 localStorage.removeItem('refreshToken')
 localStorage.removeItem('user')
 localStorage.removeItem('authUser')
 
 // Dispatch event to notify other components
 window.dispatchEvent(new Event('auth:updated'))
 }

 // No timeout cleanup needed (reactive-only)

 return (
 <AuthContext.Provider value={{
 isAuthenticated,
 user,
 login,
 verify2FA,
 logout,
 token,
 initialized
 }}>
 {children}
 </AuthContext.Provider>
 )
}

