import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { 
  BellIcon,
  EyeIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { profileService, Profile, UpdatePreferencesData } from '../services/profileService'
import toast from 'react-hot-toast'

interface ProfileSettingsProps {
  profile: Profile
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile }) => {
  const [preferences, setPreferences] = useState(profile.preferences)
  const queryClient = useQueryClient()

  // Update preferences mutation
  const updatePreferencesMutation = useMutation(
    (data: UpdatePreferencesData) => profileService.updatePreferences(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile'])
        toast.success('Preferences updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update preferences')
      }
    }
  )

  const handleNotificationChange = (key: keyof typeof preferences.notifications, value: boolean) => {
    const newPreferences = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value
      }
    }
    setPreferences(newPreferences)
    updatePreferencesMutation.mutate({ notifications: { [key]: value } })
  }

  const handlePrivacyChange = (key: keyof typeof preferences.privacy, value: boolean | string) => {
    const newPreferences = {
      ...preferences,
      privacy: {
        ...preferences.privacy,
        [key]: value
      }
    }
    setPreferences(newPreferences)
    updatePreferencesMutation.mutate({ privacy: { [key]: value } })
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    const newPreferences = {
      ...preferences,
      theme
    }
    setPreferences(newPreferences)
    updatePreferencesMutation.mutate({ theme })
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'auto', label: 'Auto', icon: ComputerDesktopIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BellIcon className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-900">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Email Notifications</h4>
              <p className="text-sm text-slate-500">Receive notifications via email</p>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.notifications.email}
                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                disabled={updatePreferencesMutation.isLoading}
              />
              <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Push Notifications</h4>
              <p className="text-sm text-slate-500">Receive push notifications in your browser</p>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.notifications.push}
                onChange={(e) => handleNotificationChange('push', e.target.checked)}
                disabled={updatePreferencesMutation.isLoading}
              />
              <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">SMS Notifications</h4>
              <p className="text-sm text-slate-500">Receive notifications via SMS</p>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.notifications.sms}
                onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                disabled={updatePreferencesMutation.isLoading}
              />
              <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <EyeIcon className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-900">Privacy Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Profile Visibility
            </label>
            <select
              value={preferences.privacy.profile_visibility}
              onChange={(e) => handlePrivacyChange('profile_visibility', e.target.value)}
              disabled={updatePreferencesMutation.isLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-300"
            >
              <option value="public">Public - Anyone can see your profile</option>
              <option value="private">Private - Only you can see your profile</option>
              <option value="friends">Friends - Only your connections can see your profile</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Show Email Address</h4>
              <p className="text-sm text-slate-500">Display your email address on your profile</p>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.privacy.show_email}
                onChange={(e) => handlePrivacyChange('show_email', e.target.checked)}
                disabled={updatePreferencesMutation.isLoading}
              />
              <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Show Phone Number</h4>
              <p className="text-sm text-slate-500">Display your phone number on your profile</p>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.privacy.show_phone}
                onChange={(e) => handlePrivacyChange('show_phone', e.target.checked)}
                disabled={updatePreferencesMutation.isLoading}
              />
              <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Theme Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value as 'light' | 'dark' | 'auto')}
                disabled={updatePreferencesMutation.isLoading}
                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                  preferences.theme === option.value
                    ? 'border-slate-300 bg-white'
                    : 'border-slate-300 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${
                  preferences.theme === option.value ? 'text-slate-700' : 'text-slate-400'
                }`} />
                <div className={`text-sm font-medium ${
                  preferences.theme === option.value ? 'text-slate-900' : 'text-slate-700'
                }`}>
                  {option.label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Export Your Data</h4>
              <p className="text-sm text-slate-500">Download a copy of all your data</p>
            </div>
            <button className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
              Export Data
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings

