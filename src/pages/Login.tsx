import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService, LoginRequest, TwoFAVerifyRequest } from '../services/authService'
import TwoFactorVerification from '../components/TwoFactorVerification'
import Forced2FASetup from '../components/Forced2FASetup'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [requiresForced2FASetup, setRequiresForced2FASetup] = useState(false)
  const [tempToken, setTempToken] = useState<string>('')
  const [rememberMe, setRememberMe] = useState(false)
  const [twoFAError, setTwoFAError] = useState('')
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()
  const { isAuthenticated, initialized } = useAuth()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (initialized && isAuthenticated) {
      // Prefer SPA navigation to avoid reload loops
      navigate('/', { replace: true })
    }
  }, [initialized, isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTwoFAError('')
    setLoginError('')

    console.log('=== LOGIN PAGE: Submit started ===')
    console.log('Form data:', { username: formData.username, password: '***' })

    try {
  const result = await authService.login(formData)
      console.log('=== LOGIN PAGE: Login result ===', result)
      
      // Check if 2FA is required
      if ('requires_2fa' in result && result.requires_2fa) {
        const step1 = result as any
        // Save temp_token if provided (needed for 2FA verification)
        if (step1.temp_token) {
          setTempToken(step1.temp_token)
        }
        // Only go to forced setup when backend explicitly flags it
        if (step1.requires_2fa_setup) {
          setRequiresForced2FASetup(true)
          toast.success('Please set up Two-Factor Authentication')
        } else {
          // Regular 2FA verification
          setRequires2FA(true)
          toast.success('Please enter your 2FA code')
        }
      } else {
  // Normal login success - tokens saved; notify context and SPA navigate
  toast.success('Login successful!')
  window.dispatchEvent(new Event('auth:updated'))
  navigate('/', { replace: true })
      }
    } catch (error: any) {
      console.error('=== LOGIN PAGE: Error caught ===', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      
      // Handle different error formats
      let errorMessage = 'Login failed'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.log('=== LOGIN PAGE: Showing error ===', errorMessage)
      
      // Set error state to display in UI
      setLoginError(errorMessage)
    } finally {
      setIsLoading(false)
      console.log('=== LOGIN PAGE: Submit completed ===')
    }
  }

  const handle2FAVerify = async (code: string) => {
    setIsLoading(true)
    setTwoFAError('')

    try {
      const verifyData: TwoFAVerifyRequest = {
        temp_token: tempToken || undefined,
        username: formData.username,
        password: formData.password,
        code: code
      }
      
      await authService.verify2FA(verifyData)
      
      toast.success('Login successful!')
      
  // Notify context and SPA navigate
  window.dispatchEvent(new Event('auth:updated'))
  navigate('/', { replace: true })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '2FA verification failed'
      setTwoFAError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack2FA = () => {
    setRequires2FA(false)
    setRequiresForced2FASetup(false)
    setTempToken('')
    setTwoFAError('')
  }

  const handleForced2FAComplete = () => {
    toast.success('2FA setup complete! Logging you in...')
    window.dispatchEvent(new Event('auth:updated'))
    navigate('/', { replace: true })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Show Forced 2FA Setup if required
  if (requiresForced2FASetup) {
    return (
      <Forced2FASetup
        tempToken={tempToken}
        username={formData.username}
        onComplete={handleForced2FAComplete}
        onBack={handleBack2FA}
        // If setup-temp fails (e.g., 400 invalid/expired), fall back to regular 2FA verification
        onSetupFallback={() => {
          setRequiresForced2FASetup(false)
          setRequires2FA(true)
        }}
      />
    )
  }

  // Show 2FA verification page if required
  if (requires2FA) {
    return (
      <TwoFactorVerification
        username={formData.username}
        password={formData.password}
        onVerify={handle2FAVerify}
        onBack={handleBack2FA}
        isLoading={isLoading}
        error={twoFAError}
      />
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-20"></div>
              <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Please sign in to your account
            </p>
          </div>
          
          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-800"></div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-14 py-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>



              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm font-semibold rounded-2xl hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 hover:opacity-20 transition-opacity"></div>
                {isLoading ? (
                  <div className="flex items-center justify-center relative z-10">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <span className="relative z-10">Sign In</span>
                )}
              </button>

              {/* Error Message Display */}
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{loginError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLoginError('')}
                      className="ml-3 flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}

            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Information Panel */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-16 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full"></div>
        </div>

        <div className="flex flex-col justify-center px-12 py-16 relative z-10">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Secure Access Portal
            </h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Your gateway to a comprehensive user management system with 
              advanced security features and intuitive controls.
            </p>
          </div>

          <div className="space-y-8">
            {/* Features */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Secure Authentication</h3>
                <p className="text-blue-200 text-sm">Multi-factor authentication and advanced security</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">User Management</h3>
                <p className="text-blue-200 text-sm">Complete control over users, roles, and permissions</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Role-Based Access</h3>
                <p className="text-blue-200 text-sm">Granular permissions and access control</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Analytics Dashboard</h3>
                <p className="text-blue-200 text-sm">Real-time insights and comprehensive reporting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login