import React, { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { authService } from '../services/authService'
import TwoFactorSettings from '../components/TwoFactorSettings'
import toast from 'react-hot-toast'

const Settings: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const queryClient = useQueryClient()
  
  // Get current user
  const { data: currentUser, refetch } = useQuery('currentUser', authService.getCurrentUser, {
    initialData: authService.getCurrentUser()
  })

  const handleRefresh = async () => {
    await queryClient.invalidateQueries('currentUser')
    await refetch()
    toast.success('Settings refreshed!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and security preferences
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-4 sm:mt-0 px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-slate-500/30 hover:shadow-xl hover:shadow-slate-500/40 font-semibold text-xs group"
          title="Refresh settings"
        >
          <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
          <span>Refresh</span>
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-lg font-medium text-white">
                {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{currentUser?.username}</h3>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
            <div className="mt-1 flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                currentUser?.is_active 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentUser?.is_active ? 'Active' : 'Inactive'}
              </span>
              {currentUser?.roles?.map((role: string) => (
                <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-600" />
            <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
          </div>
        </div>

        <div className="p-6">
          <TwoFactorSettings 
            isEnabled={is2FAEnabled}
            onStatusChange={setIs2FAEnabled}
          />
        </div>
      </div>
    </div>
  )
}

export default Settings

