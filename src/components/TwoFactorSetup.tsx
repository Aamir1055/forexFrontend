import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { QrCodeIcon, KeyIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { authService, TwoFASetupResponse } from '../services/authService'
import QRCodeDisplay from './QRCodeDisplay'
import BackupCodes from './BackupCodes'
import toast from 'react-hot-toast'

const TwoFactorSetup: React.FC = () => {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'enabled'>('initial')
  const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const queryClient = useQueryClient()

  // Setup 2FA mutation
  const setup2FAMutation = useMutation(authService.setup2FA, {
    onSuccess: (data) => {
      setSetupData(data)
      setBackupCodes(data.backup_codes)
      setStep('setup')
      toast.success('2FA setup ready! Scan the QR code with your authenticator app.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to setup 2FA')
    }
  })

  // Enable 2FA mutation
  const enable2FAMutation = useMutation(authService.enable2FA, {
    onSuccess: () => {
      setIs2FAEnabled(true)
      setStep('enabled')
      toast.success('2FA has been enabled successfully!')
      queryClient.invalidateQueries('currentUser')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid verification code')
    }
  })

  // Disable 2FA mutation
  const disable2FAMutation = useMutation(authService.disable2FA, {
    onSuccess: () => {
      setIs2FAEnabled(false)
      setStep('initial')
      setDisablePassword('')
      toast.success('2FA has been disabled')
      queryClient.invalidateQueries('currentUser')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA')
    }
  })

  // Regenerate backup codes mutation
  const regenerateCodesMutation = useMutation(authService.regenerateBackupCodes, {
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes)
      toast.success('New backup codes generated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to regenerate backup codes')
    }
  })

  const handleSetup2FA = () => {
    setup2FAMutation.mutate()
  }

  const handleVerify2FA = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    enable2FAMutation.mutate({
      code: verificationCode,
      backup_codes: backupCodes
    })
  }

  const handleDisable2FA = () => {
    if (!disablePassword) {
      toast.error('Please enter your password')
      return
    }

    disable2FAMutation.mutate({ password: disablePassword })
  }

  const handleRegenerateBackupCodes = () => {
    regenerateCodesMutation.mutate()
  }

  if (step === 'initial' && !is2FAEnabled) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Enhance Your Security
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSetup2FA}
          disabled={setup2FAMutation.isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <KeyIcon className="h-4 w-4 mr-2" />
          {setup2FAMutation.isLoading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
        </button>
      </div>
    )
  }

  if (step === 'setup' && setupData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <QrCodeIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Scan QR Code</h3>
            <p className="text-sm text-gray-500">Use your authenticator app to scan this QR code</p>
          </div>
        </div>

        <div className="space-y-6">
          <QRCodeDisplay qrCodeUri={setupData.qr_code_uri} />
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Manual Entry</h4>
            <p className="text-xs text-gray-500 mb-2">If you can't scan the QR code, enter this secret manually:</p>
            <div className="bg-gray-50 p-3 rounded-md border">
              <code className="text-sm font-mono break-all">{setupData.secret}</code>
            </div>
          </div>

          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center tracking-widest"
              placeholder="000000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <BackupCodes codes={backupCodes} />

          <div className="flex space-x-3">
            <button
              onClick={handleVerify2FA}
              disabled={enable2FAMutation.isLoading || verificationCode.length !== 6}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {enable2FAMutation.isLoading ? 'Verifying...' : 'Enable 2FA'}
            </button>
            <button
              onClick={() => setStep('initial')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'enabled' || is2FAEnabled) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication Enabled</h3>
            <p className="text-sm text-gray-500">Your account is protected with 2FA</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                2FA is Active
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your account is now protected with two-factor authentication. You'll need your authenticator app to sign in.</p>
              </div>
            </div>
          </div>
        </div>

        {backupCodes.length > 0 && <BackupCodes codes={backupCodes} />}

        <div className="space-y-3">
          <button
            onClick={handleRegenerateBackupCodes}
            disabled={regenerateCodesMutation.isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <KeyIcon className="h-4 w-4 mr-2" />
            {regenerateCodesMutation.isLoading ? 'Generating...' : 'Regenerate Backup Codes'}
          </button>

          <div className="border-t pt-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Disable Two-Factor Authentication
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>This will remove the extra security layer from your account.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="disable-password" className="block text-sm font-medium text-gray-700">
                  Enter your password to disable 2FA
                </label>
                <input
                  id="disable-password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
              <button
                onClick={handleDisable2FA}
                disabled={disable2FAMutation.isLoading || !disablePassword}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {disable2FAMutation.isLoading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default TwoFactorSetup