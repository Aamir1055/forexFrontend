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
      navigate('/login', { replace: true })
    }
  }, [initialized, isAuthenticated, navigate])
  
  if (!initialized) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Loading...</div>
    </div>
  }

  if (!isAuthenticated) {
    return null
  }
  
  return <>{children}</>
}

export default ProtectedRoute