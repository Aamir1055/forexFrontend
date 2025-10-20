import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { profileService, Profile, ChangePasswordData } from '../services/profileService'
import toast from 'react-hot-toast'

interface ProfileSecurityProps {
  profile: Profile
}

const ProfileSecurity: React.FC<ProfileSecurityProps> = ({ profile }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  
  const queryClient = useQueryClient()

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data: ChangePasswordData) => profileService.changePassword(data),
    {
      onSuccess: () => {
        setShowPasswordForm(false)
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
        toast.success('Password changed successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to change password')
      }
    }
  )

  // Enable 2FA mutation
  const enable2FAMutation = useMutation(
    () => profileService.enable2FA(),
    {
      onSuccess: (data) => {
        setQrCode(data.qr_code)
        setBackupCodes(data.backup_codes)
        setShow2FASetup(true)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to enable 2FA')
      }
    }
  )

  // Confirm 2FA mutation
  const confirm2FAMutation = useMutation(
    (code: string) => profileService.confirm2FA(code),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile'])
        setShow2FASetup(false)
        setVerificationCode('')
        toast.success('Two-factor authentication enabled successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Invalid verification code')
      }
    }
  )

  // Disable 2FA mutation
  const disable2FAMutation = useMutation(
    (password: string) => profileService.disable2FA(password),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile'])
        toast.success('Two-factor authentication disabled successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to disable 2FA')
      }
    }
  )

  // Send email verification mutation
  const sendEmailVerificationMutation = useMutation(
    () => profileService.sendEmailVerification(),
    {
      onSuccess: () => {
        toast.success('Verification email sent!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to send verification email')
      }
    }
  )

  // Send phone verification mutation
  const sendPhoneVerificationMutation = useMutation(
    () => profileService.sendPhoneVerification(),
    {
      onSuccess: () => {
        toast.success('Verification SMS sent!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to send verification SMS')
      }
    }
  )

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    changePasswordMutation.mutate(passwordData)
  }

  const handleDisable2FA = () => {
    const password = prompt('Enter your password to disable 2FA:')
    if (password) {
      disable2FAMutation.mutate(password)
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Security */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <KeyIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Password Security</h3>
        </div>
        
        {!showPasswordForm ? (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Password</h4>
              <p className="text-sm text-gray-500">Last changed: Never</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Change Password
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={changePasswordMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
        </div>
        
        {!profile.two_factor_enabled ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Two-Factor Authentication Disabled</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Enable 2FA to add an extra layer of security to your account.
                </p>
              </div>
            </div>
            <button
              onClick={() => enable2FAMutation.mutate()}
              disabled={enable2FAMutation.isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {enable2FAMutation.isLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <ShieldCheckIcon className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Two-Factor Authentication Enabled</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
            </div>
            <button
              onClick={handleDisable2FA}
              disabled={disable2FAMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {disable2FAMutation.isLoading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        )}

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set up Two-Factor Authentication</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter verification code from your app:
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Backup Codes</h4>
                  <p className="text-xs text-yellow-700 mb-2">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-white p-1 rounded text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => confirm2FAMutation.mutate(verificationCode)}
                    disabled={!verificationCode || confirm2FAMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {confirm2FAMutation.isLoading ? 'Verifying...' : 'Enable 2FA'}
                  </button>
                  <button
                    onClick={() => setShow2FASetup(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Verification */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Account Verification</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Verification</h4>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              {profile.email_verified ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Verified
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Not Verified
                  </span>
                  <button
                    onClick={() => sendEmailVerificationMutation.mutate()}
                    disabled={sendEmailVerificationMutation.isLoading}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {sendEmailVerificationMutation.isLoading ? 'Sending...' : 'Verify'}
                  </button>
                </>
              )}
            </div>
          </div>
          
          {profile.phone && (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Phone Verification</h4>
                <p className="text-sm text-gray-500">{profile.phone}</p>
              </div>
              <div className="flex items-center space-x-2">
                {profile.phone_verified ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Verified
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Not Verified
                    </span>
                    <button
                      onClick={() => sendPhoneVerificationMutation.mutate()}
                      disabled={sendPhoneVerificationMutation.isLoading}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {sendPhoneVerificationMutation.isLoading ? 'Sending...' : 'Verify'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSecurity