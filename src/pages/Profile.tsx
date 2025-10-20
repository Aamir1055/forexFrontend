import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  UserCircleIcon,
  CogIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { profileService } from '../services/profileService'
import ProfileInfo from '../components/ProfileInfo'
import ProfileSettings from '../components/ProfileSettings'
import ProfileSecurity from '../components/ProfileSecurity'
import ProfileActivity from '../components/ProfileActivity'
import ProfileSessions from '../components/ProfileSessions'

type TabType = 'info' | 'settings' | 'security' | 'activity' | 'sessions'

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('info')

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery(
    'profile',
    () => profileService.getProfile(),
    {
      retry: 1,
    }
  )

  const tabs = [
    {
      id: 'info' as TabType,
      name: 'Profile Info',
      icon: UserCircleIcon,
      description: 'Personal information and avatar'
    },
    {
      id: 'settings' as TabType,
      name: 'Settings',
      icon: CogIcon,
      description: 'Preferences and notifications'
    },
    {
      id: 'security' as TabType,
      name: 'Security',
      icon: ShieldCheckIcon,
      description: 'Password and 2FA settings'
    },
    {
      id: 'activity' as TabType,
      name: 'Activity',
      icon: ClockIcon,
      description: 'Account activity and logs'
    },
    {
      id: 'sessions' as TabType,
      name: 'Sessions',
      icon: ComputerDesktopIcon,
      description: 'Active sessions and devices'
    }
  ]

  const renderTabContent = () => {
    if (!profile) return null

    switch (activeTab) {
      case 'info':
        return <ProfileInfo profile={profile} />
      case 'settings':
        return <ProfileSettings profile={profile} />
      case 'security':
        return <ProfileSecurity profile={profile} />
      case 'activity':
        return <ProfileActivity />
      case 'sessions':
        return <ProfileSessions />
      default:
        return <ProfileInfo profile={profile} />
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-200">
          <ShieldCheckIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
          <p className="text-gray-600">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
              <p className="text-gray-500">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{tab.name}</div>
                        <div className="text-xs text-gray-500 truncate">{tab.description}</div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
                  <p className="text-gray-600 font-medium">Loading profile...</p>
                </div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile