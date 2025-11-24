import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const QuickLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'admin123'
  })

  const handleQuickLogin = async () => {
    setIsLoading(true)
    try {
      console.log('Attempting quick login...')
      
      // Try using the authService login
      const result = await authService.login(credentials)
      console.log('Login result:', result)
      
      // Check if 2FA is required
      if ('requires_2fa' in result && result.requires_2fa) {
        toast.error('2FA is required. Please use the main login page.')
        return
      }
      
      toast.success('Login successful!')
      window.location.reload()
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectApiLogin = async () => {
    setIsLoading(true)
    try {
      console.log('Attempting direct API login...')
      
      const response = await fetch('http://185.136.159.142:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()
      console.log('Direct API response:', data)

      if (data.status === 'success' && data.data?.access_token) {
        console.log('Setting tokens in localStorage...')
        
        // Manually set tokens
        localStorage.setItem('authToken', data.data.access_token)
        console.log('✅ authToken set:', data.data.access_token.substring(0, 20) + '...')
        
        if (data.data.refresh_token) {
          localStorage.setItem('refreshToken', data.data.refresh_token)
          console.log('✅ refreshToken set')
        }
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user))
          console.log('✅ user set:', data.data.user)
        }
        
        // Verify tokens were set
        const verifyToken = localStorage.getItem('authToken')
        const verifyUser = localStorage.getItem('user')
        console.log('Verification - Token exists:', !!verifyToken)
        console.log('Verification - User exists:', !!verifyUser)
        console.log('Verification - isAuthenticated:', authService.isAuthenticated())
        
        toast.success('Direct login successful!')
        
        // Dispatch auth update and navigate
        window.dispatchEvent(new Event('auth:updated'))
        navigate('/', { replace: true })
      } else if (data.data?.requires_2fa) {
        toast.error('This account has 2FA enabled. Please use the main login page.')
      } else {
        toast.error('Direct login failed: ' + (data.message || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Direct login error:', error)
      toast.error('Direct login failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Login</h3>
      
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Username"
          value={credentials.username}
          onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        />
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleQuickLogin}
          disabled={isLoading}
          className="w-full px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login via AuthService'}
        </button>
        
        <button
          onClick={handleDirectApiLogin}
          disabled={isLoading}
          className="w-full px-3 py-1.5 bg-yellow-500 text-black text-xs rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Direct API Login'}
        </button>
      </div>
    </div>
  )
}

export default QuickLogin

