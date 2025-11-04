import api from './api'
import { ApiResponse } from '../types'

export interface Profile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  job_title?: string
  timezone?: string
  language?: string
  is_active: boolean
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
  last_login?: string
  login_count: number
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    privacy: {
      profile_visibility: 'public' | 'private' | 'friends'
      show_email: boolean
      show_phone: boolean
    }
    theme: 'light' | 'dark' | 'auto'
  }
}

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  job_title?: string
  timezone?: string
  language?: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface UpdatePreferencesData {
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  privacy?: {
    profile_visibility?: 'public' | 'private' | 'friends'
    show_email?: boolean
    show_phone?: boolean
  }
  theme?: 'light' | 'dark' | 'auto'
}

export interface ActivityLog {
  id: number
  action: string
  description: string
  ip_address: string
  user_agent: string
  location?: string
  created_at: string
}

export interface SecurityEvent {
  id: number
  event_type: 'login' | 'logout' | 'password_change' | 'profile_update' | 'suspicious_activity'
  description: string
  ip_address: string
  location?: string
  device_info: string
  risk_level: 'low' | 'medium' | 'high'
  created_at: string
}

export interface Session {
  id: string
  device_name: string
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  ip_address: string
  location?: string
  is_current: boolean
  last_activity: string
  created_at: string
}

export const profileService = {
  // Get current user profile
  async getProfile(): Promise<Profile> {
    const response = await api.get<ApiResponse<Profile>>('/api/profile')
    return response.data.data
  },

  // Update profile
  async updateProfile(data: UpdateProfileData): Promise<Profile> {
    const response = await api.put<ApiResponse<Profile>>('/api/profile', data)
    return response.data.data
  },

  // Upload avatar
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await api.post<ApiResponse<{ avatar_url: string }>>(
      '/api/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data
  },

  // Delete avatar
  async deleteAvatar(): Promise<void> {
    await api.delete('/api/profile/avatar')
  },

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.post('/api/profile/change-password', data)
  },

  // Update preferences
  async updatePreferences(data: UpdatePreferencesData): Promise<Profile> {
    const response = await api.put<ApiResponse<Profile>>('/api/profile/preferences', data)
    return response.data.data
  },

  // Get activity logs
  async getActivityLogs(page = 1, limit = 20): Promise<{
    activities: ActivityLog[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {
    const response = await api.get<ApiResponse<{
      activities: ActivityLog[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>>(`/api/profile/activity?page=${page}&limit=${limit}`)
    return response.data.data
  },

  // Get security events
  async getSecurityEvents(page = 1, limit = 20): Promise<{
    events: SecurityEvent[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {
    const response = await api.get<ApiResponse<{
      events: SecurityEvent[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>>(`/api/profile/security-events?page=${page}&limit=${limit}`)
    return response.data.data
  },

  // Get active sessions
  async getSessions(): Promise<Session[]> {
    const response = await api.get<ApiResponse<Session[]>>('/api/profile/sessions')
    return response.data.data
  },

  // Revoke session
  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/api/profile/sessions/${sessionId}`)
  },

  // Revoke all other sessions
  async revokeAllOtherSessions(): Promise<void> {
    await api.delete('/api/profile/sessions/others')
  },

  // Enable 2FA
  async enable2FA(): Promise<{
    qr_code: string
    secret: string
    backup_codes: string[]
  }> {
    const response = await api.post<ApiResponse<{
      qr_code: string
      secret: string
      backup_codes: string[]
    }>>('/api/profile/2fa/enable')
    return response.data.data
  },

  // Verify and confirm 2FA
  async confirm2FA(code: string): Promise<void> {
    await api.post('/api/profile/2fa/confirm', { code })
  },

  // Disable 2FA
  async disable2FA(password: string): Promise<void> {
    await api.post('/api/profile/2fa/disable', { password })
  },

  // Generate new backup codes
  async generateBackupCodes(): Promise<{ backup_codes: string[] }> {
    const response = await api.post<ApiResponse<{ backup_codes: string[] }>>('/api/profile/2fa/backup-codes')
    return response.data.data
  },

  // Verify email
  async sendEmailVerification(): Promise<void> {
    await api.post('/api/profile/verify-email')
  },

  // Verify phone
  async sendPhoneVerification(): Promise<void> {
    await api.post('/api/profile/verify-phone')
  },

  // Confirm phone verification
  async confirmPhoneVerification(code: string): Promise<void> {
    await api.post('/api/profile/verify-phone/confirm', { code })
  },

  // Delete account
  async deleteAccount(password: string): Promise<void> {
    await api.post('/api/profile/delete-account', { password })
  },

  // Export data
  async exportData(): Promise<{ download_url: string }> {
    const response = await api.post<ApiResponse<{ download_url: string }>>('/api/profile/export-data')
    return response.data.data
  }
}
