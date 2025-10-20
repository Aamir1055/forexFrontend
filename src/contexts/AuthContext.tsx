import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  user: { username: string; email: string } | null
  login: (username: string, password: string) => Promise<boolean | 'requires_2fa'>
  verify2FA: (username: string, password: string, totpCode: string) => Promise<boolean>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

  useEffect(() => {
    // Check for existing auth on mount
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user') || localStorage.getItem('authUser')
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        // Clear invalid data
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        localStorage.removeItem('authUser')
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean | 'requires_2fa'> => {
    try {
      // Use the correct API URL based on environment
      const baseURL = import.meta.env.DEV ? 'http://185.136.159.142:8080' : 'http://185.136.159.142:8080'
      const apiUrl = `${baseURL}/api/auth/login`
      
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
      
      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText)
        return false
      }

      const data = await response.json()
      console.log('Login response:', data)

      // Handle 2FA requirement
      if (data.status === 'success' && data.data?.requires_2fa) {
        console.log('2FA required')
        return 'requires_2fa'
      }

      // Handle successful login
      if (data.status === 'success' && data.data?.access_token) {
        console.log('Login successful!')
        const token = data.data.access_token
        const userData = data.data.user
        
        setToken(token)
        setUser({ username: userData.username, email: userData.email })
        setIsAuthenticated(true)
        
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('authUser', JSON.stringify({ username: userData.username, email: userData.email }))
        
        return true
      }

      // Handle other success cases or errors
      if (data.status === 'error') {
        console.error('Login error from server:', data.message)
        return false
      }

      console.log('Unexpected response format:', data)
      return false
    } catch (error) {
      console.error('Login network error:', error)
      return false
    }
  }

  const verify2FA = async (username: string, password: string, totpCode: string): Promise<boolean> => {
    try {
      const baseURL = import.meta.env.DEV ? 'http://185.136.159.142:8080' : 'http://185.136.159.142:8080'
      const apiUrl = `${baseURL}/api/auth/verify-2fa`
      
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
        const userData = data.data.user

        localStorage.setItem('authToken', token)
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
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      verify2FA,
      logout,
      token
    }}>
      {children}
    </AuthContext.Provider>
  )
}