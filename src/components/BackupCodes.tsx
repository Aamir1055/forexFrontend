import React, { useState } from 'react'
import { DocumentDuplicateIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface BackupCodesProps {
  codes: string[]
}

const BackupCodes: React.FC<BackupCodesProps> = ({ codes }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const codesText = codes.join('\n')
      await navigator.clipboard.writeText(codesText)
      setCopied(true)
      toast.success('Backup codes copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy backup codes')
    }
  }

  const handleDownload = () => {
    const codesText = codes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Backup codes downloaded')
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Save Your Backup Codes
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-3">
              Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
            
            <div className="bg-white border border-yellow-300 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Backup Codes ({codes.length})</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    {isVisible ? (
                      <>
                        <EyeSlashIcon className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Show
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              
              {isVisible ? (
                <div className="grid grid-cols-2 gap-2">
                  {codes.map((code, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-center">
                      <code className="text-xs font-mono">{code}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500">Click "Show" to reveal backup codes</p>
                </div>
              )}
            </div>

            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1 border border-yellow-300 text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Download Codes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackupCodes