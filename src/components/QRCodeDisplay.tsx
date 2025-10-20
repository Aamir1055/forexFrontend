import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  qrCodeUri: string
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrCodeUri }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && qrCodeUri) {
      QRCode.toCanvas(canvasRef.current, qrCodeUri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('Error generating QR code:', error)
        }
      })
    }
  }, [qrCodeUri])

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
        <canvas ref={canvasRef} />
      </div>
      <div className="text-center">
        <h4 className="text-sm font-medium text-gray-900 mb-1">Scan with your authenticator app</h4>
        <p className="text-xs text-gray-500">
          Use Google Authenticator, Authy, or any compatible TOTP app
        </p>
      </div>
    </div>
  )
}

export default QRCodeDisplay