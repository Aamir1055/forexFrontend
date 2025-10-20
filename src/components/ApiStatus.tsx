import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkApiStatus = async () => {
    try {
      await api.get('/api/users?page=1&limit=1')
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
      case 'connected': return 'bg-green-100 text-green-800 border-green-200'
      case 'disconnected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <CheckCircleIcon className="h-4 w-4" />
      case 'disconnected': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
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
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
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