import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { profileService, ActivityLog, SecurityEvent } from '../services/profileService'

type TabType = 'activity' | 'security'

const ProfileActivity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('activity')
  const [activityPage, setActivityPage] = useState(1)
  const [securityPage, setSecurityPage] = useState(1)

  // Fetch activity logs
  const { data: activityData, isLoading: activityLoading } = useQuery(
    ['profile-activity', activityPage],
    () => profileService.getActivityLogs(activityPage, 10),
    {
      keepPreviousData: true,
      retry: 1,
    }
  )

  // Fetch security events
  const { data: securityData, isLoading: securityLoading } = useQuery(
    ['profile-security-events', securityPage],
    () => profileService.getSecurityEvents(securityPage, 10),
    {
      keepPreviousData: true,
      retry: 1,
    }
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('login')) {
      return <ClockIcon className="w-4 h-4 text-green-500" />
    } else if (action.includes('logout')) {
      return <ClockIcon className="w-4 h-4 text-gray-500" />
    } else if (action.includes('update') || action.includes('change')) {
      return <InformationCircleIcon className="w-4 h-4 text-blue-500" />
    } else {
      return <InformationCircleIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getSecurityIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      case 'medium':
        return <ShieldExclamationIcon className="w-4 h-4 text-yellow-500" />
      default:
        return <InformationCircleIcon className="w-4 h-4 text-green-500" />
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-green-100 text-green-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity Logs
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security Events
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              {activityLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading activity logs...</p>
                </div>
              ) : activityData?.activities.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No activity logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityData?.activities.map((activity: ActivityLog) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{activity.action}</h4>
                          <span className="text-xs text-gray-500">{formatDate(activity.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>IP: {activity.ip_address}</span>
                          {activity.location && <span>Location: {activity.location}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {activityData && activityData.pagination.pages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-gray-600">
                        Showing {((activityPage - 1) * 10) + 1} to {Math.min(activityPage * 10, activityData.pagination.total)} of {activityData.pagination.total} results
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setActivityPage(activityPage - 1)}
                          disabled={activityPage === 1}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {activityPage} of {activityData.pagination.pages}
                        </span>
                        <button
                          onClick={() => setActivityPage(activityPage + 1)}
                          disabled={activityPage === activityData.pagination.pages}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Events</h3>
              
              {securityLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading security events...</p>
                </div>
              ) : securityData?.events.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldExclamationIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No security events found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityData?.events.map((event: SecurityEvent) => (
                    <div key={event.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getSecurityIcon(event.risk_level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 capitalize">
                              {event.event_type.replace('_', ' ')}
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(event.risk_level)}">
                              {event.risk_level} risk
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(event.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>IP: {event.ip_address}</span>
                          {event.location && <span>Location: {event.location}</span>}
                          <span>Device: {event.device_info}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {securityData && securityData.pagination.pages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-gray-600">
                        Showing {((securityPage - 1) * 10) + 1} to {Math.min(securityPage * 10, securityData.pagination.total)} of {securityData.pagination.total} results
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSecurityPage(securityPage - 1)}
                          disabled={securityPage === 1}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {securityPage} of {securityData.pagination.pages}
                        </span>
                        <button
                          onClick={() => setSecurityPage(securityPage + 1)}
                          disabled={securityPage === securityData.pagination.pages}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileActivity

