import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkApiStatus = async () => {
    try {
      // Use a lightweight health-check that won't trigger auth refresh logic
      const baseUrl = api.defaults.baseURL || ''
      await fetch(`${baseUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(5000) })
      setStatus('connected')
    } catch (error) {
      setStatus('disconnected')
    }
    setLastCheck(new Date())
  }

  useEffect(() => {
    checkApiStatus()
    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'disconnected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-blue-100 text-slate-800 border-slate-300'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <CheckCircleIcon className="h-4 w-4" />
      case 'disconnected': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'API Connected'
      case 'disconnected': return 'API Disconnected'
      default: return 'Checking...'
    }
  }

  return (
    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}">
      {getStatusIcon()}
      <span className="ml-1">{getStatusText()}</span>
      {lastCheck && (
        <span className="ml-1 opacity-75">
          ({lastCheck.toLocaleTimeString()})
        </span>
      )}
    </div>
  )
}

export default ApiStatus

