import React from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  MapPinIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { profileService, Session } from '../services/profileService'
import ConfirmationDialog from './ui/ConfirmationDialog'
import toast from 'react-hot-toast'
import { useState } from 'react'

const ProfileSessions: React.FC = () => {
  const [revokeConfirmation, setRevokeConfirmation] = useState<{
    isOpen: boolean
    sessionId: string | null
    deviceName: string
  }>({
    isOpen: false,
    sessionId: null,
    deviceName: ''
  })
  const [showRevokeAllConfirmation, setShowRevokeAllConfirmation] = useState(false)
  
  const queryClient = useQueryClient()

  // Fetch sessions
  const { data: sessions, isLoading, error } = useQuery(
    'profile-sessions',
    () => profileService.getSessions(),
    {
      retry: 1,
    }
  )

  // Revoke session mutation
  const revokeSessionMutation = useMutation(
    (sessionId: string) => profileService.revokeSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile-sessions'])
        toast.success('Session revoked successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to revoke session')
      }
    }
  )

  // Revoke all other sessions mutation
  const revokeAllOtherSessionsMutation = useMutation(
    () => profileService.revokeAllOtherSessions(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile-sessions'])
        toast.success('All other sessions revoked successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to revoke sessions')
      }
    }
  )

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="w-6 h-6 text-gray-500" />
      case 'tablet':
        return <DeviceTabletIcon className="w-6 h-6 text-gray-500" />
      default:
        return <ComputerDesktopIcon className="w-6 h-6 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return formatDate(dateString)
  }

  const handleRevokeSession = (sessionId: string, deviceName: string) => {
    setRevokeConfirmation({
      isOpen: true,
      sessionId,
      deviceName
    })
  }

  const confirmRevokeSession = () => {
    if (revokeConfirmation.sessionId) {
      revokeSessionMutation.mutate(revokeConfirmation.sessionId)
      setRevokeConfirmation({ isOpen: false, sessionId: null, deviceName: '' })
    }
  }

  const cancelRevokeSession = () => {
    setRevokeConfirmation({ isOpen: false, sessionId: null, deviceName: '' })
  }

  const handleRevokeAllOtherSessions = () => {
    setShowRevokeAllConfirmation(true)
  }

  const confirmRevokeAllOtherSessions = () => {
    revokeAllOtherSessionsMutation.mutate()
    setShowRevokeAllConfirmation(false)
  }

  const cancelRevokeAllOtherSessions = () => {
    setShowRevokeAllConfirmation(false)
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <ComputerDesktopIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Sessions</h3>
          <p className="text-gray-600">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage your active sessions across all devices
            </p>
          </div>
          {sessions && sessions.filter(s => !s.is_current).length > 0 && (
            <button
              onClick={handleRevokeAllOtherSessions}
              disabled={revokeAllOtherSessionsMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {revokeAllOtherSessionsMutation.isLoading ? 'Revoking...' : 'Revoke All Other Sessions'}
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : sessions?.length === 0 ? (
          <div className="p-8 text-center">
            <ComputerDesktopIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active sessions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions?.map((session: Session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(session.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {session.device_name}
                        </h4>
                        {session.is_current && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{session.browser} on {session.os}</span>
                          <span>•</span>
                          <span>IP: {session.ip_address}</span>
                        </div>
                        {session.location && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <MapPinIcon className="w-3 h-3" />
                            <span>{session.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <ClockIcon className="w-3 h-3" />
                          <span>Last active: {getTimeAgo(session.last_activity)}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Created: {formatDate(session.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!session.is_current && (
                    <button
                      onClick={() => handleRevokeSession(session.id, session.device_name)}
                      disabled={revokeSessionMutation.isLoading}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Revoke session"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ComputerDesktopIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
            <p className="text-sm text-blue-700 mt-1">
              If you see any sessions you don't recognize, revoke them immediately and change your password. 
              Sessions are automatically revoked after 30 days of inactivity.
            </p>
          </div>
        </div>
      </div>

      {/* Revoke Session Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={revokeConfirmation.isOpen}
        onClose={cancelRevokeSession}
        onConfirm={confirmRevokeSession}
        title="Revoke Session"
        message={`Are you sure you want to revoke the session for "${revokeConfirmation.deviceName}"? This will immediately log out this device.`}
        confirmText="Revoke Session"
        cancelText="Cancel"
        type="danger"
        isLoading={revokeSessionMutation.isLoading}
      />

      {/* Revoke All Other Sessions Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showRevokeAllConfirmation}
        onClose={cancelRevokeAllOtherSessions}
        onConfirm={confirmRevokeAllOtherSessions}
        title="Revoke All Other Sessions"
        message="Are you sure you want to revoke all other sessions? This will immediately log out all other devices except your current one."
        confirmText="Revoke All Sessions"
        cancelText="Cancel"
        type="danger"
        isLoading={revokeAllOtherSessionsMutation.isLoading}
      />
    </div>
  )
}

export default ProfileSessions