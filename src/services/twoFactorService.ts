import api from './api'
import { ApiResponse } from '../types'

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

export interface BackupCodesResponse {
  backup_codes: string[]
}

export const twoFactorService = {
  // Setup 2FA - Get QR code and backup codes
  async setup2FA(): Promise<TwoFASetupResponse> {
    const response = await api.post<ApiResponse<TwoFASetupResponse>>('/api/auth/2fa/setup')
    return response.data.data
  },

  // Enable 2FA - Verify code and enable
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
  async regenerateBackupCodes(): Promise<BackupCodesResponse> {
    const response = await api.post<ApiResponse<BackupCodesResponse>>('/api/auth/2fa/backup-codes')
    return response.data.data
  }
}