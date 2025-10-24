import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { brokerProfileService, BrokerProfile, CreateBrokerProfileData, UpdateBrokerProfileData, Right, Group } from '../services/brokerProfileService'
import toast from 'react-hot-toast'

interface BrokerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBrokerProfileData | UpdateBrokerProfileData) => Promise<void>
  profile: BrokerProfile | null
  isLoading: boolean
}

type TabType = 'basic' | 'rights' | 'groups'

const BrokerProfileModal: React.FC<BrokerProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profile,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedRights: [] as number[],
    selectedGroups: [] as number[]
  })

  // Fetch all rights
  const { data: allRights, isLoading: loadingRights } = useQuery(
    ['broker-rights-all'],
    () => brokerProfileService.getAllRights(),
    {
      onSuccess: (data) => {
        console.log('All Rights fetched:', data)
        console.log('Sample right structure:', data?.[0])
        const ids = data?.map(r => r.id) || []
        console.log('All Right IDs:', JSON.stringify(ids))
        console.log('First 3 IDs:', ids.slice(0, 3))
        console.log('Type of first ID:', typeof data?.[0]?.id)
      }
    }
  )

  // Fetch all groups
  const { data: allGroups, isLoading: loadingGroups } = useQuery(
    ['broker-groups-all'],
    () => brokerProfileService.getAllGroups()
  )

  // Fetch profile details when editing
  const { data: profileDetails } = useQuery(
    ['broker-profile', profile?.id],
    () => brokerProfileService.getProfileById(profile!.id),
    {
      enabled: !!profile?.id
    }
  )

  // Initialize form data
  useEffect(() => {
    if (profile && profileDetails) {
      console.log('Profile Details:', profileDetails)
      console.log('Rights from profile:', profileDetails.rights)
      const rightIds = profileDetails.rights.map(r => r.rightId)
      console.log('Selected Right IDs (rightId from profile):', JSON.stringify(rightIds))
      console.log('First 3 IDs:', rightIds.slice(0, 3))
      console.log('Type of first ID:', typeof rightIds[0])
      
      setFormData({
        name: profile.name,
        description: profile.description,
        selectedRights: rightIds,
        selectedGroups: profileDetails.groups.map(g => g.groupId)
      })
    } else {
      setFormData({
        name: '',
        description: '',
        selectedRights: [],
        selectedGroups: []
      })
    }
  }, [profile, profileDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Profile name is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Profile description is required')
      return
    }

    try {
      const submitData: CreateBrokerProfileData = {
        name: formData.name,
        description: formData.description,
        rights: formData.selectedRights,
        groups: formData.selectedGroups
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleRightToggle = (rightId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedRights: prev.selectedRights.includes(rightId)
        ? prev.selectedRights.filter(id => id !== rightId)
        : [...prev.selectedRights, rightId]
    }))
  }

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
    }))
  }

  const selectAllRights = () => {
    setFormData(prev => ({
      ...prev,
      selectedRights: allRights?.map(r => r.id) || []
    }))
  }

  const deselectAllRights = () => {
    setFormData(prev => ({
      ...prev,
      selectedRights: []
    }))
  }

  const selectAllGroups = () => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: allGroups?.map(g => g.id) || []
    }))
  }

  const deselectAllGroups = () => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: []
    }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
              <h2 className="text-xl font-bold text-white">
                {profile ? 'Edit Profile' : 'Create New Profile'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('basic')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'basic'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('rights')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'rights'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rights ({formData.selectedRights.length})
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'groups'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Groups ({formData.selectedGroups.length})
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tab Content */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter profile name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter profile description"
                        rows={4}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Rights Tab */}
                {activeTab === 'rights' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Select Rights</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllRights}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllRights}
                          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {loadingRights ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allRights?.map((right: Right) => (
                          <label
                            key={right.id}
                            className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedRights.includes(right.id)}
                              onChange={() => handleRightToggle(right.id)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{right.name}</div>
                              <div className="text-xs text-gray-500">{right.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Select Groups</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllGroups}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllGroups}
                          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {loadingGroups ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {allGroups?.map((group: Group) => (
                          <label
                            key={group.id}
                            className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedGroups.includes(group.id)}
                              onChange={() => handleGroupToggle(group.id)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-900">{group.broker_view_group}</div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  group.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {group.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">MT5: {group.mt5_group}</div>
                              {group.description && (
                                <div className="text-xs text-gray-500 mt-1">{group.description}</div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default BrokerProfileModal
