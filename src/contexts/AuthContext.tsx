import React, { createContext, useContext, useState, useEffect } from 'react'
import { buildApiUrl } from '../lib/apiBase'

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
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // Proactive token refresh - schedules refresh 60 seconds before expiry
  const scheduleTokenRefresh = (accessToken: string) => {
    // Clear any existing timeout
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId)
    }

    try {
      // Decode JWT to get expiry time
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const expiryTime = payload.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime
      
      // Schedule refresh 60 seconds before expiry
      const refreshTime = timeUntilExpiry - 60000 // 60 seconds before expiry
      
      if (refreshTime > 0) {
        console.log(`🔄 Token refresh scheduled in ${Math.floor(refreshTime / 1000)} seconds`)
        
        const timeoutId = setTimeout(async () => {
          console.log('🔄 Proactive token refresh triggered')
          await performTokenRefresh()
        }, refreshTime)
        
        setRefreshTimeoutId(timeoutId)
      } else {
        console.warn('⚠️ Token already expired or expiring soon, will refresh on next API call')
      }
    } catch (error) {
      console.error('❌ Failed to decode token for refresh scheduling:', error)
    }
  }

  // Perform the actual token refresh
  const performTokenRefresh = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        console.error('❌ No refresh token available for proactive refresh')
        logout()
        return
      }

      const apiUrl = buildApiUrl('/api/auth/refresh')
      console.log('🔄 Calling proactive refresh token API...')
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        console.error('❌ Proactive token refresh failed')
        logout()
        return
      }

      const data = await response.json()
      const newAccessToken = data.data?.access_token
      const newRefreshToken = data.data?.refresh_token

      if (newAccessToken) {
        localStorage.setItem('authToken', newAccessToken)
        setToken(newAccessToken)
        
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }
        
        console.log('✅ Proactive token refresh successful')
        
        // Schedule the next refresh
        scheduleTokenRefresh(newAccessToken)
        
        // Dispatch event for WebSocket reconnection
        window.dispatchEvent(new CustomEvent('token:refreshed', { detail: { token: newAccessToken } }))
      }
    } catch (error) {
      console.error('❌ Proactive token refresh error:', error)
      logout()
    }
  }

  useEffect(() => {
    // Check for existing auth on mount
    const checkAndRefreshAuth = async () => {
      const savedToken = localStorage.getItem('authToken')
      const savedRefreshToken = localStorage.getItem('refreshToken')
      const savedUser = localStorage.getItem('user') || localStorage.getItem('authUser')

      // If access token exists, use it
      if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
        setToken(savedToken)
        setIsAuthenticated(true)
        // Schedule proactive refresh for existing token
        scheduleTokenRefresh(savedToken)
      } 
      // If no access token but refresh token exists, STAY AUTHENTICATED
      // The API interceptor will automatically refresh on the first API call
      else if ((!savedToken || savedToken === 'undefined' || savedToken === 'null') && 
          savedRefreshToken && savedRefreshToken !== 'undefined' && savedRefreshToken !== 'null') {
        console.log('🔄 No access token but refresh token exists - staying authenticated')
        console.log('🔄 API interceptor will handle token refresh on first API call')
        setIsAuthenticated(true) // Keep user authenticated
        // Don't call refresh here - let the API interceptor handle it naturally
      }
      // If neither token exists, user is not authenticated
      else {
        console.log('🔒 No tokens found, user not authenticated')
        setIsAuthenticated(false)
      }

      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        } catch (error) {
          console.error('Error parsing saved user data:', error)
          // Clear invalid user data only; keep tokens so user stays logged in
          localStorage.removeItem('user')
          localStorage.removeItem('authUser')
        }
      }
      
      setInitialized(true)
    }

    checkAndRefreshAuth()
  }, [])

  // Listen for explicit auth updates (after login/2FA) and storage changes
  useEffect(() => {
    const handler = async () => {
      const savedToken = localStorage.getItem('authToken')
      const savedRefreshToken = localStorage.getItem('refreshToken')
      const savedUser = localStorage.getItem('user') || localStorage.getItem('authUser')

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
      } else if ((savedToken === null || savedToken === 'undefined' || savedToken === 'null') && 
                 savedRefreshToken && savedRefreshToken !== 'null' && savedRefreshToken !== 'undefined') {
        // Access token missing but refresh token exists - STAY AUTHENTICATED, let API interceptor handle refresh
        console.log('🔄 Access token missing but refresh token exists - staying authenticated, API interceptor will handle refresh')
        setIsAuthenticated(true) // Keep user authenticated
        // Don't set token here - let the API interceptor handle the refresh when the next API call happens
      }

      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          setUser(null)
        }
      } else if (savedUser === null) {
        setUser(null)
      }

      setInitialized(true)
    }

    const storageListener = (e: StorageEvent) => {
      // Only react to storage changes from other tabs/windows
      // Don't react to programmatic changes in the same tab (the API interceptor handles that)
      if (e.key && ['authToken', 'user', 'authUser', 'refreshToken'].includes(e.key)) {
        handler()
      }
    }

    window.addEventListener('auth:updated', handler as EventListener)
    window.addEventListener('storage', storageListener)
    return () => {
      window.removeEventListener('auth:updated', handler as EventListener)
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
        
        // Schedule proactive token refresh
        scheduleTokenRefresh(token)
        
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
        
        // Schedule proactive token refresh
        scheduleTokenRefresh(token)
        
        return true
      }

      return false
    } catch (error) {
      console.error('2FA verification error:', error)
      return false
    }
  }

  const logout = () => {
    // Clear the refresh timeout
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId)
      setRefreshTimeoutId(null)
    }
    
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId)
      }
    }
  }, [refreshTimeoutId])

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

