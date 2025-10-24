import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { brokerProfileService, BrokerProfile, CreateBrokerProfileData, UpdateBrokerProfileData } from '../services/brokerProfileService'
import BrokerProfileModal from '../components/BrokerProfileModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'

const BrokerProfiles: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BrokerProfile | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortField(field)
      setSortOrder('ASC')
    }
  }

  const filteredProfiles = profilesData?.profiles?.filter((profile: BrokerProfile) =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const sortedProfiles = useMemo(() => {
    if (!sortField) return filteredProfiles

    return [...filteredProfiles].sort((a: BrokerProfile, b: BrokerProfile) => {
      let aValue: any = a[sortField as keyof BrokerProfile]
      let bValue: any = b[sortField as keyof BrokerProfile]

      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1
      return 0
    })
  }, [filteredProfiles, sortField, sortOrder])

  // Pagination calculations
  const totalItems = sortedProfiles.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProfiles = sortedProfiles.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleSubmit = async (data: CreateBrokerProfileData | UpdateBrokerProfileData): Promise<void> => {
    if (editingProfile) {
      await updateProfileMutation.mutateAsync({ id: editingProfile.id, data: data as UpdateBrokerProfileData })
    } else {
      await createProfileMutation.mutateAsync(data as CreateBrokerProfileData)
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
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl sticky top-0 z-40">
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
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  onClick={handleCreateProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create Profile</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-6">
        <div>
          {/* Pagination dropdown */}
          <div className="mt-4 mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-gray-600">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-xs"
              >
                <option value={9999}>All</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs text-gray-600">entries</span>
            </div>
            <div className="text-xs text-gray-700">
              Showing {totalItems === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Profiles Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th 
                          onDoubleClick={() => handleSort('name')}
                          className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          title="Double-click to sort"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Profile Name</span>
                            {sortField === 'name' && (
                              <span className="text-blue-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th 
                          onDoubleClick={() => handleSort('rightsCount')}
                          className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          title="Double-click to sort"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Rights</span>
                            {sortField === 'rightsCount' && (
                              <span className="text-blue-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          onDoubleClick={() => handleSort('groupsCount')}
                          className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          title="Double-click to sort"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Groups</span>
                            {sortField === 'groupsCount' && (
                              <span className="text-blue-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          onDoubleClick={() => handleSort('createdAt')}
                          className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          title="Double-click to sort"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Created At</span>
                            {sortField === 'createdAt' && (
                              <span className="text-blue-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedProfiles?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                            {searchTerm ? 'No profiles found matching your search.' : 'No profiles found. Create your first profile to get started.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedProfiles?.map((profile: BrokerProfile) => (
                          <motion.tr
                            key={profile.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-3 py-2">
                              <div className="text-xs font-medium text-gray-900">{profile.name}</div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-xs text-gray-700">{profile.description || 'No description'}</div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                                {profile.rightsCount} rights
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                                {profile.groupsCount} groups
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-xs text-gray-700">
                                {new Date(profile.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center space-x-0.5">
                                <button
                                  onClick={() => handleEditProfile(profile)}
                                  className="group relative p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-md hover:scale-105"
                                  title="Edit Profile"
                                >
                                  <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="group relative p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-md hover:scale-105"
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
          </motion.div>
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
