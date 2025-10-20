import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { PlusIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { brokerProfileService, BrokerProfile, CreateBrokerProfileData, UpdateBrokerProfileData } from '../services/brokerProfileService'
import BrokerProfileModal from '../components/BrokerProfileModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'

const BrokerProfiles: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BrokerProfile | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    profileId: number | null
    profileName: string
  }>({
    isOpen: false,
    profileId: null,
    profileName: ''
  })

  const queryClient = useQueryClient()

  // Fetch profiles
  const { data: profilesData, isLoading, error } = useQuery(
    ['broker-profiles'],
    () => brokerProfileService.getAllProfiles(),
    {
      keepPreviousData: true,
    }
  )

  // Create profile mutation
  const createProfileMutation = useMutation(
    (data: CreateBrokerProfileData) => brokerProfileService.createProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['broker-profiles'])
        setIsModalOpen(false)
        toast.success('Profile created successfully!')
      },
      onError: (error: any) => {
        console.error('Create profile error:', error)
        toast.error(error.response?.data?.message || 'Failed to create profile')
      }
    }
  )

  // Update profile mutation
  const updateProfileMutation = useMutation(
    ({ id, data }: { id: number; data: UpdateBrokerProfileData }) =>
      brokerProfileService.updateProfile(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['broker-profiles'])
        setIsModalOpen(false)
        setEditingProfile(null)
        toast.success('Profile updated successfully!')
      },
      onError: (error: any) => {
        console.error('Update profile error:', error)
        toast.error(error.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  // Delete profile mutation
  const deleteProfileMutation = useMutation(
    (id: number) => brokerProfileService.deleteProfile(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['broker-profiles'])
        toast.success('Profile deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete profile')
      }
    }
  )

  const handleCreateProfile = () => {
    setEditingProfile(null)
    setIsModalOpen(true)
  }

  const handleEditProfile = (profile: BrokerProfile) => {
    setEditingProfile(profile)
    setIsModalOpen(true)
  }

  const handleDeleteProfile = (id: number) => {
    const profile = profilesData?.profiles?.find((p: BrokerProfile) => p.id === id)
    setDeleteConfirmation({
      isOpen: true,
      profileId: id,
      profileName: profile?.name || 'Unknown Profile'
    })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.profileId) {
      deleteProfileMutation.mutate(deleteConfirmation.profileId)
      setDeleteConfirmation({ isOpen: false, profileId: null, profileName: '' })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, profileId: null, profileName: '' })
  }

  const handleSubmit = async (data: CreateBrokerProfileData | UpdateBrokerProfileData) => {
    if (editingProfile) {
      return await updateProfileMutation.mutateAsync({ id: editingProfile.id, data: data as UpdateBrokerProfileData })
    } else {
      return await createProfileMutation.mutateAsync(data as CreateBrokerProfileData)
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading profiles. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Broker Profiles</h1>
                <p className="text-sm text-gray-500">Manage broker permission profiles</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateProfile}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Create Profile</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Profile Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rights
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Groups
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profilesData?.profiles?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No profiles found. Create your first profile to get started.
                      </td>
                    </tr>
                  ) : (
                    profilesData?.profiles?.map((profile: BrokerProfile) => (
                      <motion.tr
                        key={profile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{profile.description}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {profile.rightsCount} rights
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {profile.groupsCount} groups
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-600">
                            {new Date(profile.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleEditProfile(profile)}
                              className="group relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-md hover:scale-105"
                              title="Edit Profile"
                            >
                              <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteProfile(profile.id)}
                              className="group relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-md hover:scale-105"
                              title="Delete Profile"
                            >
                              <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {isModalOpen && (
        <BrokerProfileModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProfile(null)
          }}
          onSubmit={handleSubmit}
          profile={editingProfile}
          isLoading={createProfileMutation.isLoading || updateProfileMutation.isLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Profile"
        message={`Are you sure you want to delete "${deleteConfirmation.profileName}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}

export default BrokerProfiles
