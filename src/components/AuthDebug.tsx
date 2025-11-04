import React, { useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    authToken: '',
    refreshToken: '',
    user: '',
    authUser: '',
    isAuthenticated: false
  })

  const updateDebugInfo = () => {
    const authToken = localStorage.getItem('authToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const user = localStorage.getItem('user')
    const authUser = localStorage.getItem('authUser')
    const isAuthenticated = authService.isAuthenticated()
    
    setDebugInfo({
      authToken: authToken || '',
      refreshToken: refreshToken || '',
      user: user || '',
      authUser: authUser || '',
      isAuthenticated
    })
  }

  useEffect(() => {
    // Update immediately
    updateDebugInfo()
    
    // Update every second to catch changes
    const interval = setInterval(updateDebugInfo, 1000)
    
    // Listen for storage changes
    const handleStorageChange = () => {
      updateDebugInfo()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const { authToken, refreshToken, user, authUser, isAuthenticated } = debugInfo

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Auth Debug</h3>
      <div className="space-y-1 text-xs">
        <div>
          <span className="font-medium">Auth Token:</span> 
          <span className={authToken ? 'text-green-600' : 'text-red-600'}>
            {authToken ? 'Present' : 'Missing'}
          </span>
        </div>
        <div>
          <span className="font-medium">Refresh Token:</span> 
          <span className={refreshToken ? 'text-green-600' : 'text-red-600'}>
            {refreshToken ? 'Present' : 'Missing'}
          </span>
        </div>
        <div>
          <span className="font-medium">User Data:</span> 
          <span className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? 'Present' : 'Missing'}
          </span>
        </div>
        <div>
          <span className="font-medium">Auth User:</span> 
          <span className={authUser ? 'text-green-600' : 'text-red-600'}>
            {authUser ? 'Present' : 'Missing'}
          </span>
        </div>
        <div>
          <span className="font-medium">Is Authenticated:</span> 
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>
        {authToken && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs break-all">
            <div className="font-medium">Token (first 20 chars):</div>
            <div>{authToken.substring(0, 20)}...</div>
          </div>
        )}
        <div className="flex space-x-1 mt-2">
          <button
            onClick={() => {
              updateDebugInfo()
            }}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              console.log('Manual auth check:', {
                authToken: !!authToken,
                user: !!user,
                isAuthenticated: authService.isAuthenticated()
              })
            }}
            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
          >
            Log State
          </button>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthDebug

