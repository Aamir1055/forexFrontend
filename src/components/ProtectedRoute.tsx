import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, initialized } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (initialized && !isAuthenticated) {
      // Check if refresh token exists before redirecting
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (!refreshToken) {
        // No refresh token, must login
        console.log('🔒 No authentication tokens found, redirecting to login')
        navigate('/login', { replace: true })
      } else {
        // Refresh token exists, stay on page and let API interceptor handle refresh
        console.log('🔄 Access token missing but refresh token exists, waiting for API call to refresh')
      }
    }
  }, [initialized, isAuthenticated, navigate])
  
  if (!initialized) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Loading...</div>
    </div>
  }

  // Allow access if authenticated OR if refresh token exists (API will handle refresh)
  const refreshToken = localStorage.getItem('refreshToken')
  if (!isAuthenticated && !refreshToken) {
    return null
  }
  
  return <>{children}</>
}

export default ProtectedRoute

