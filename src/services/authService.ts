import api from './api'
import { ApiResponse } from '../types'

export interface LoginRequest {
  username: string
  password: string
  code?: string // For 2FA
}

export interface LoginStep1Response {
  requires_2fa: boolean
  message: string
  // When true, user must perform initial 2FA setup using temp_token
  requires_2fa_setup?: boolean
  temp_token?: string  // For forced 2FA setup
}

export interface TwoFAVerifyRequest {
  username?: string  // Optional, use temp_token instead if available
  password?: string  // Optional, use temp_token instead if available
  temp_token?: string  // Preferred method for 2FA verification
  code: string
}

export interface TwoFAVerifyBackupRequest {
  username: string
  password: string
  backup_code: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: {
    id: number
    username: string
    email: string
    is_active: boolean
    roles: string[]
  }
}

export interface TwoFASetupResponse {
  backup_codes: string[]
  message: string
  qr_code_uri: string
  secret: string
}

export interface TwoFAEnableRequest {
  code: string
  backup_codes: string[]
}

export interface TwoFADisableRequest {
  password: string
}

export interface TwoFASetupTempRequest {
  temp_token: string
}

export interface TwoFAEnableTempRequest {
  temp_token: string
  code: string
  backup_codes: string[]
}

export const authService = {
  // Internal helper to safely persist auth
  _saveAuth(loginData: any) {
    const at = loginData?.access_token
    const rt = loginData?.refresh_token
    
    console.log('🔒 Storing auth tokens:', { hasAccessToken: !!at, hasRefreshToken: !!rt })
    
    if (!at) {
      throw new Error('Missing access token in response')
    }
    
    localStorage.setItem('authToken', at)
    
    // Store refresh token if available, but don't require it for initial compatibility
    if (rt) {
      localStorage.setItem('refreshToken', rt)
      console.log('✅ Refresh token stored successfully')
    } else {
      console.warn('⚠️ No refresh token in response - auto-refresh will not work')
    }
    
    if (loginData?.user) {
      try {
        localStorage.setItem('user', JSON.stringify(loginData.user))
        localStorage.setItem('authUser', JSON.stringify(loginData.user))
      } catch (error) {
        console.error('Error saving user data:', error)
      }
    }
  },
  // Login (Step 1 - may require 2FA)
  async login(credentials: LoginRequest): Promise<LoginResponse | LoginStep1Response> {
    try {
      const response = await api.post<ApiResponse<LoginResponse | LoginStep1Response>>('/api/auth/login', credentials)
      const data = response.data.data
      
      // Normalize backend response shapes
      const d: any = data as any
      const requires2FASetup = d?.requires_2fa_setup === true
      const requires2FA = d?.requires_2fa === true || requires2FASetup

      if (requires2FA) {
        const result: LoginStep1Response = {
          requires_2fa: true,
          message: d?.message || 'Two-factor authentication required',
        }
        // Include temp_token if provided (needed for 2FA verification)
        if (d?.temp_token) {
          result.temp_token = d.temp_token
        }
        // Mark as setup flow if backend explicitly says so
        if (requires2FASetup) {
          result.requires_2fa_setup = true
        }
        return result
      }
      
      // Normal login success - store tokens
      const loginData = data as LoginResponse
      // Persist tokens defensively
      authService._saveAuth(loginData)
      
      return loginData
    } catch (error: any) {
      // Handle 403 error for forced 2FA setup
      if (error.response?.status === 403) {
        const errorData = error.response.data
        // Check if it's a forced 2FA setup requirement
        const temp = errorData?.data?.temp_token || errorData?.temp_token
        const setup = errorData?.data?.requires_2fa_setup === true || errorData?.requires_2fa_setup === true
        if (temp) {
          const result: LoginStep1Response = {
            requires_2fa: true,
            message: errorData.message || 'Two-factor authentication required',
            temp_token: temp,
          }
          // Mark setup only when backend explicitly flags it
          if (setup) {
            result.requires_2fa_setup = true
          }
          return result
        }
      }
      // Re-throw other errors
      throw error
    }
  },

  // Verify with backup code
  async verify2FAWithBackupCode(credentials: TwoFAVerifyBackupRequest): Promise<LoginResponse> {
    const attempts: Array<{ url: string; body: Record<string, any> }> = [
      { url: '/api/auth/verify-2fa', body: { username: credentials.username, password: credentials.password, backup_code: credentials.backup_code } },
      { url: '/api/auth/login', body: { username: credentials.username, password: credentials.password, backup_code: credentials.backup_code } },
    ]

    let lastError: any
    for (const attempt of attempts) {
      try {
        const resp = await api.post<ApiResponse<LoginResponse>>(attempt.url, attempt.body)
        const data = resp?.data?.data
        if (data?.access_token && data?.refresh_token) {
          authService._saveAuth(data)
          return data
        }
        lastError = new Error('Backup code verify response missing tokens')
      } catch (err: any) {
        lastError = err
        const status = err?.response?.status
        if (status && ![400, 404, 405, 422].includes(status)) {
          break
        }
      }
    }
    throw lastError || new Error('Backup code verification failed')
  },

  // Verify 2FA (Step 2)
  async verify2FA(credentials: TwoFAVerifyRequest): Promise<LoginResponse> {
    console.log('🔐 verify2FA called with:', { 
      hasTempToken: !!credentials.temp_token, 
      hasUsername: !!credentials.username, 
      hasPassword: !!credentials.password, 
      hasCode: !!credentials.code 
    })
    
    // Try multiple endpoint/payload combinations to match backend
    const attempts: Array<{ url: string; body: Record<string, any> }> = []
    
    // Prefer temp_token method (modern API)
    if (credentials.temp_token) {
      attempts.push(
        { url: '/api/auth/verify-2fa', body: { temp_token: credentials.temp_token, totp_code: credentials.code } },
        { url: '/api/auth/verify-2fa', body: { temp_token: credentials.temp_token, code: credentials.code } },
      )
    }
    
    // Fallback to username/password method (legacy API)
    if (credentials.username && credentials.password) {
      attempts.push(
        { url: '/api/auth/verify-2fa', body: { username: credentials.username, password: credentials.password, totp_code: credentials.code } },
        { url: '/api/auth/verify-2fa', body: { username: credentials.username, password: credentials.password, code: credentials.code } },
        { url: '/api/auth/login', body: { username: credentials.username, password: credentials.password, code: credentials.code } },
        { url: '/api/auth/login', body: { username: credentials.username, password: credentials.password, totp_code: credentials.code } },
      )
    }

    let lastError: any
    let attemptNumber = 0
    for (const attempt of attempts) {
      attemptNumber++
      try {
        console.log(`🔄 Attempt ${attemptNumber}/${attempts.length}: ${attempt.url}`, { bodyKeys: Object.keys(attempt.body) })
        const resp = await api.post<ApiResponse<LoginResponse>>(attempt.url, attempt.body)
        const data = resp?.data?.data
        if (data?.access_token && data?.refresh_token) {
          console.log(`✅ Attempt ${attemptNumber} succeeded!`)
          authService._saveAuth(data)
          return data
        }
        // If no tokens were returned, remember error and continue
        console.log(`⚠️ Attempt ${attemptNumber} returned no tokens`)
        lastError = new Error('2FA verify response missing tokens')
      } catch (err: any) {
        lastError = err
        const status = err?.response?.status
        const message = err?.response?.data?.message || err.message
        console.log(`❌ Attempt ${attemptNumber} failed with status ${status}: ${message}`)
        // Continue to the next attempt on client or validation errors
        if (status && ![400, 404, 405, 422].includes(status)) {
          // For unexpected statuses, break early
          console.log(`🛑 Breaking early due to unexpected status: ${status}`)
          break
        }
      }
    }
    console.error('❌ All 2FA verification attempts failed')
    throw lastError || new Error('2FA verification failed')
  },

  // Logout
  async logout(): Promise<void> {
    try {
      // Call logout API to invalidate token on server
      await api.post('/api/auth/logout')
      console.log('Logout API call successful')
    } catch (error) {
      console.error('Logout API call failed:', error)
      // Continue with cleanup even if API call fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      console.log('Local storage cleared')
    }
  },

  // Refresh access token using stored refresh token
  async refreshToken(): Promise<{ access_token: string; expires_in: number }> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post<ApiResponse<{ access_token: string; expires_in: number; token_type: string }>>('/api/auth/refresh', {
      refresh_token: refreshToken
    })
    
    const data = response.data.data
    if (data.access_token) {
      localStorage.setItem('authToken', data.access_token)
      console.log('✅ Token refreshed manually')
    }
    
    return data
  },

  // Note: Token refresh is also handled automatically by the API interceptor

  // 2FA Setup
  async setup2FA(): Promise<TwoFASetupResponse> {
    const response = await api.post<ApiResponse<TwoFASetupResponse>>('/api/auth/2fa/setup')
    return response.data.data
  },

  // Enable 2FA
  async enable2FA(data: TwoFAEnableRequest): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/auth/2fa/enable', data)
    return response.data.data
  },

  // Disable 2FA
  async disable2FA(data: TwoFADisableRequest): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/auth/2fa/disable', data)
    return response.data.data
  },

  // Regenerate backup codes
  async regenerateBackupCodes(): Promise<{ backup_codes: string[] }> {
    const response = await api.post<ApiResponse<{ backup_codes: string[] }>>('/api/auth/2fa/backup-codes')
    return response.data.data
  },

  // Setup 2FA with temp token (for forced 2FA)
  async setup2FAWithTempToken(data: TwoFASetupTempRequest): Promise<TwoFASetupResponse> {
    const response = await api.post<ApiResponse<TwoFASetupResponse>>('/api/auth/2fa/setup-temp', data)
    return response.data.data
  },

  // Enable 2FA with temp token (for forced 2FA)
  async enable2FAWithTempToken(data: TwoFAEnableTempRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/api/auth/2fa/enable-temp', data)
    const loginData = response.data.data
    // Store tokens after successful 2FA setup (throws if missing)
    authService._saveAuth(loginData)

    return loginData
  },

  // Get current user
  getCurrentUser(): any {
    const user = localStorage.getItem('user')
    if (!user || user === 'undefined' || user === 'null') {
      return null
    }
    try {
      return JSON.parse(user)
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem('user')
      return null
    }
  },

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken')
  },

  // Get token
  getToken(): string | null {
    return localStorage.getItem('authToken')
  },

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  },

  // Check if token is expired or about to expire (within 5 minutes)
  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) return true

    try {
      // Decode JWT token to check expiration
      const base64Payload = token.split('.')[1]
      const payload = JSON.parse(atob(base64Payload))
      const currentTime = Math.floor(Date.now() / 1000)
      const bufferTime = 5 * 60 // 5 minutes buffer
      
      return payload.exp < (currentTime + bufferTime)
    } catch (error) {
      console.error('Error decoding token:', error)
      return true // Assume expired if we can't decode
    }
  }
}
