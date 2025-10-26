import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheckIcon, ArrowLeftIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

interface Forced2FASetupProps {
  tempToken: string
  username: string
  onComplete: () => void
  onBack: () => void
  // Optional: when setup-temp fails (e.g., 400 invalid/expired), fall back to regular 2FA verification
  onSetupFallback?: () => void
}

const Forced2FASetup: React.FC<Forced2FASetupProps> = ({
  tempToken,
  username,
  onComplete,
  onBack,
  onSetupFallback
}) => {
  const [step, setStep] = useState<'loading' | 'setup' | 'verify'>('loading')
  const [qrCodeUri, setQrCodeUri] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)
  const [qrLoadError, setQrLoadError] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Base API origin for resolving relative QR paths returned by backend (dev & prod use same host here)
  const apiOrigin = 'http://185.136.159.142:8080'

  const normalizedQrSrc = useMemo(() => {
    const input = (qrCodeUri || '').trim()
    if (!input) return ''
    // If we already generated a data URL for otpauth, prefer it
    if (qrDataUrl) return qrDataUrl
    // Already a data URL or absolute URL
    if (input.startsWith('data:') || input.startsWith('http://') || input.startsWith('https://')) return input
    // Raw SVG markup
    if (input.startsWith('<svg')) return 'data:image/svg+xml;utf8,' + encodeURIComponent(input)
    // Relative path from API (e.g., /qrcode/abc.png)
    if (input.startsWith('/')) return `${apiOrigin}${input}`
    // Heuristic: looks like base64 content without header
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(input) && input.replace(/\s/g, '').length > 100) {
      return `data:image/png;base64,${input.replace(/\r?\n/g, '')}`
    }
    // otpauth URI - will be handled in effect to generate a QR data URL
    if (input.startsWith('otpauth:')) return ''
    // Fallback to input as-is
    return input
  }, [qrCodeUri, qrDataUrl])

  // If backend returns an otpauth URI, generate a QR code image client-side
  useEffect(() => {
    const input = (qrCodeUri || '').trim()
    if (!input || !input.startsWith('otpauth:')) return
    let cancelled = false
    ;(async () => {
      try {
        const QR = await import('qrcode')
        const url = await QR.toDataURL(input, { margin: 1, scale: 6 })
        if (!cancelled) {
          setQrDataUrl(url)
          setQrLoadError(false)
        }
      } catch (e) {
        if (!cancelled) setQrLoadError(true)
      }
    })()
    return () => { cancelled = true }
  }, [qrCodeUri])

  useEffect(() => {
    setupTwoFactor()
  }, [])

  const setupTwoFactor = async () => {
    try {
      const response = await authService.setup2FAWithTempToken({ temp_token: tempToken })
      setQrCodeUri(response.qr_code_uri)
      setSecret(response.secret)
      setBackupCodes(response.backup_codes)
      setStep('setup')
    } catch (error: any) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || 'Failed to setup 2FA'
      toast.error(message)
      // If temp token is invalid/expired, fall back to regular 2FA verification if handler provided
      if (status === 400 && onSetupFallback) {
        onSetupFallback()
      } else {
        onBack()
      }
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authService.enable2FAWithTempToken({
        temp_token: tempToken,
        code: verificationCode,
        backup_codes: backupCodes
      })
      
      toast.success('2FA setup complete! Redirecting...')
      onComplete()
    } catch (error: any) {
      const msg = error?.message || error?.response?.data?.message || 'Invalid verification code'
      // If server succeeded but did not send tokens, ask user to log in again
      if (msg.includes('Missing tokens')) {
        toast.error('Setup finished, but session couldn’t start automatically. Please log in again.')
        onBack()
        return
      }
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopiedBackupCodes(true)
    toast.success('Backup codes copied to clipboard')
    setTimeout(() => setCopiedBackupCodes(false), 3000)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setVerificationCode(value)
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up Two-Factor Authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Two-Factor Authentication Required
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Your account requires 2FA setup for enhanced security
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {step === 'setup' ? (
              <>
                {/* Instructions */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Setup Instructions</h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">1</span>
                      <span>Install an authenticator app (Google Authenticator, Authy, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">2</span>
                      <span>Scan the QR code below with your authenticator app</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">3</span>
                      <span>Save your backup codes in a secure location</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">4</span>
                      <span>Enter the 6-digit code from your app to verify</span>
                    </li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* QR Code */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Scan QR Code</h4>
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                      {normalizedQrSrc && !qrLoadError ? (
                        <img
                          src={normalizedQrSrc}
                          alt="2FA QR Code"
                          className="w-full h-auto"
                          onError={() => setQrLoadError(true)}
                        />
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-600">QR code could not be loaded.</p>
                          {normalizedQrSrc ? (
                            <p className="text-xs text-gray-500 mt-1">
                              You can
                              <a href={normalizedQrSrc} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline mx-1">open the QR in a new tab</a>
                              or use the manual entry key below.
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">Use the manual entry key below.</p>
                          )}
                        </div>
                      )}
                      {/* Actions under QR */}
                      <div className="mt-3 flex items-center justify-between">
                        {/* Download button only if we have a data URL */}
                        {(qrDataUrl || (normalizedQrSrc || '').startsWith('data:')) ? (
                          <a
                            href={qrDataUrl || normalizedQrSrc}
                            download={`2fa-qr-${username}.png`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Download QR
                          </a>
                        ) : <span />}
                        {/* For otpauth URIs, browsers cannot open them directly; offer copy only */}
                        {qrCodeUri?.startsWith('otpauth:') && (
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(qrCodeUri); toast.success('otpauth URI copied'); }}
                              className="text-xs text-gray-600 hover:text-gray-900"
                            >
                              Copy otpauth URI
                            </button>
                            <span className="text-[10px] text-gray-400 hidden md:inline" title="Most desktop browsers can't open otpauth:// links. Scan the QR or add the key manually.">
                              otpauth links don't open in browsers
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Manual Entry Key:</p>
                      <code className="text-xs font-mono text-gray-700 break-all">{secret}</code>
                    </div>
                  </div>

                  {/* Backup Codes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Backup Codes</h4>
                      <button
                        onClick={handleCopyBackupCodes}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        {copiedBackupCodes ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="w-4 h-4" />
                            <span>Copy All</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                      <p className="text-xs text-amber-800 font-medium mb-2">⚠️ Important</p>
                      <p className="text-xs text-amber-700">
                        Save these codes securely. Each code can only be used once if you lose access to your authenticator.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="font-mono text-xs bg-white px-3 py-2 rounded border border-gray-200"
                          >
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Form */}
                <form onSubmit={handleVerify} className="mt-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter Verification Code
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={handleCodeChange}
                        placeholder="000000"
                        maxLength={6}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={verificationCode.length !== 6 || isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Verifying...</span>
                          </div>
                        ) : (
                          'Verify & Complete'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={onBack}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to Login
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Setting up for: <span className="font-medium text-gray-700">{username}</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Forced2FASetup
