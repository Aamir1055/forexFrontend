import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  ShieldCheckIcon,
  QrCodeIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { twoFactorService, TwoFASetupResponse } from '../services/twoFactorService'
import toast from 'react-hot-toast'

interface TwoFactorSettingsProps {
  isEnabled: boolean
  onStatusChange: (enabled: boolean) => void
}

const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ isEnabled, onStatusChange }) => {
  const [showSetup, setShowSetup] = useState(false)
  const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)
  
  const queryClient = useQueryClient()

  // Setup 2FA mutation
  const setup2FAMutation = useMutation(
    () => twoFactorService.setup2FA(),
    {
      onSuccess: (data) => {
        setSetupData(data)
        setShowSetup(true)
        toast.success('2FA setup ready! Scan the QR code with your authenticator app.')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to setup 2FA')
      }
    }
  )

  // Enable 2FA mutation
  const enable2FAMutation = useMutation(
    (code: string) => twoFactorService.enable2FA({
      code,
      backup_codes: setupData?.backup_codes || []
    }),
    {
      onSuccess: () => {
        setShowSetup(false)
        setSetupData(null)
        setVerificationCode('')
        onStatusChange(true)
        queryClient.invalidateQueries(['profile'])
        toast.success('Two-factor authentication enabled successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Invalid verification code')
      }
    }
  )

  // Disable 2FA mutation
  const disable2FAMutation = useMutation(
    (password: string) => twoFactorService.disable2FA({ password }),
    {
      onSuccess: () => {
        setShowDisableForm(false)
        setDisablePassword('')
        onStatusChange(false)
        queryClient.invalidateQueries(['profile'])
        toast.success('Two-factor authentication disabled successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to disable 2FA')
      }
    }
  )

  // Regenerate backup codes mutation
  const regenerateCodesMutation = useMutation(
    () => twoFactorService.regenerateBackupCodes(),
    {
      onSuccess: () => {
        toast.success('Backup codes regenerated successfully!')
        // You might want to show the new codes in a modal
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to regenerate backup codes')
      }
    }
  )

  const handleSetup2FA = () => {
    setup2FAMutation.mutate()
  }

  const handleEnable2FA = () => {
    if (verificationCode.length === 6) {
      enable2FAMutation.mutate(verificationCode)
    }
  }

  const handleDisable2FA = () => {
    if (disablePassword) {
      disable2FAMutation.mutate(disablePassword)
    }
  }

  const copyBackupCodes = () => {
    if (setupData?.backup_codes) {
      const codesText = setupData.backup_codes.join('\n')
      navigator.clipboard.writeText(codesText)
      setCopiedCodes(true)
      toast.success('Backup codes copied to clipboard!')
      setTimeout(() => setCopiedCodes(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* 2FA Status */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="w-6 h-6 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
        </div>
        
        {isEnabled ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Two-Factor Authentication Enabled</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDisableForm(true)}
                disabled={disable2FAMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {disable2FAMutation.isLoading ? 'Disabling...' : 'Disable 2FA'}
              </button>
              
              <button
                onClick={() => regenerateCodesMutation.mutate()}
                disabled={regenerateCodesMutation.isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {regenerateCodesMutation.isLoading ? 'Regenerating...' : 'Regenerate Backup Codes'}
              </button>
            </div>
          </div>
        ) : (
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
              onClick={handleSetup2FA}
              disabled={setup2FAMutation.isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {setup2FAMutation.isLoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>

      {/* Disable 2FA Form */}
      {showDisableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Disable Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your password to disable two-factor authentication.
            </p>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDisable2FA}
                  disabled={!disablePassword || disable2FAMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {disable2FAMutation.isLoading ? 'Disabling...' : 'Disable 2FA'}
                </button>
                <button
                  onClick={() => {
                    setShowDisableForm(false)
                    setDisablePassword('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {showSetup && setupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Set up Two-Factor Authentication</h3>
            
            <div className="space-y-6">
              {/* Step 1: QR Code */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <QrCodeIcon className="w-5 h-5 mr-2" />
                  Step 1: Scan QR Code
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                </p>
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <img src={setupData.qr_code_uri} alt="2FA QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Can't scan? Manual entry key: <code className="bg-gray-100 px-1 rounded">{setupData.secret}</code>
                </p>
              </div>
              
              {/* Step 2: Backup Codes */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <KeyIcon className="w-5 h-5 mr-2" />
                  Step 2: Save Backup Codes
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                  <p className="text-sm text-yellow-800 mb-2 font-medium">
                    ⚠️ Important: Save these backup codes in a safe place!
                  </p>
                  <p className="text-xs text-yellow-700">
                    You can use these codes to access your account if you lose your phone.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 relative">
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    {setupData.backup_codes.map((code, index) => (
                      <div key={index} className="bg-white p-2 rounded text-center border">
                        {code}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={copyBackupCodes}
                    className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy backup codes"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
                {copiedCodes && (
                  <p className="text-xs text-green-600 mt-1">✓ Backup codes copied to clipboard!</p>
                )}
              </div>
              
              {/* Step 3: Verification */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Step 3: Enter Verification Code
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Enter the 6-digit code from your authenticator app:
                </p>
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
              
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleEnable2FA}
                  disabled={verificationCode.length !== 6 || enable2FAMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {enable2FAMutation.isLoading ? 'Enabling...' : 'Enable 2FA'}
                </button>
                <button
                  onClick={() => {
                    setShowSetup(false)
                    setSetupData(null)
                    setVerificationCode('')
                  }}
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
  )
}

export default TwoFactorSettings