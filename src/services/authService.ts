import api from './api'
import { ApiResponse } from '../types'

export interface LoginRequest {
  username: string
  password: string
  code?: string // For 2FA
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

export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/api/auth/login', credentials)
    const data = response.data.data
    
    // Store tokens
    localStorage.setItem('authToken', data.access_token)
    localStorage.setItem('refreshToken', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    return data
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

  // Note: Token refresh is handled automatically by the API interceptor

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
  }
}