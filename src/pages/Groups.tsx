import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { groupService } from '../services/groupService'
import { Group, CreateGroupData, UpdateGroupData, GroupFilters } from '../types'
import GroupTable from '../components/GroupTable'
import GroupModal from '../components/GroupModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'

const Groups: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<GroupFilters>({})
  const [viewMode] = useState<'table' | 'grid'>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    groupId: number | null
    groupName: string
  }>({
    isOpen: false,
    groupId: null,
    groupName: ''
  })

  const queryClient = useQueryClient()

  // Fetch groups with filters
  const { data: groupsData, isLoading, error } = useQuery(
    ['groups', currentPage, pageSize, searchTerm, filters],
    () => groupService.getGroups(currentPage, pageSize, { 
      ...filters, 
      search: searchTerm || undefined 
    }),
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  )

  // Create group mutation
  const createGroupMutation = useMutation(
    (data: CreateGroupData) => groupService.createGroup(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group created successfully!')
        setIsModalOpen(false)
        setSelectedGroup(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create group')
      }
    }
  )

  // Update group mutation
  const updateGroupMutation = useMutation(
    ({ id, data }: { id: number; data: UpdateGroupData }) => 
      groupService.updateGroup(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group updated successfully!')
        setIsModalOpen(false)
        setSelectedGroup(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update group')
      }
    }
  )

  // Delete group mutation
  const deleteGroupMutation = useMutation(
    (id: number) => groupService.deleteGroup(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete group')
      }
    }
  )

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    (id: number) => groupService.toggleGroupStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        toast.success('Group status updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update group status')
      }
    }
  )

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleCreateGroup = () => {
    setSelectedGroup(null)
    setIsModalOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group)
    setIsModalOpen(true)
  }

  const handleDeleteGroup = (id: number) => {
    const group = groupsData?.groups?.find((g: Group) => g.id === id)
    setDeleteConfirmation({
      isOpen: true,
      groupId: id,
      groupName: group?.broker_view_group || 'Unknown Group'
    })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.groupId) {
      deleteGroupMutation.mutate(deleteConfirmation.groupId)
      setDeleteConfirmation({ isOpen: false, groupId: null, groupName: '' })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, groupId: null, groupName: '' })
  }

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id)
  }

  const handleSubmit = (data: CreateGroupData | UpdateGroupData) => {
    if (selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.id, data })
    } else {
      createGroupMutation.mutate(data as CreateGroupData)
    }
  }

  const handleFilterChange = (newFilters: GroupFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  const groups = groupsData?.groups || []
  const pagination = groupsData?.pagination

  return (
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Groups</h1>
                  <p className="text-sm text-gray-500">Manage trading groups</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create Group</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-6">
        <div>
          {/* Pagination Controls */}
          {!isLoading && pagination && (
            <div className="mt-4 mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-gray-600">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-gray-600">entries</span>
              </div>
              <div className="text-xs text-gray-700">
                Showing {pagination.total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
              </div>
              {pagination.total_pages > 1 && (
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
                    Page {currentPage} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                    disabled={currentPage === pagination.total_pages}
                    className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Groups Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 mb-2">Failed to load groups</div>
                <button
                  onClick={() => queryClient.invalidateQueries(['groups'])}
                  className="text-red-600 hover:text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <GroupTable
                groups={groups}
                isLoading={isLoading}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                onToggleStatus={handleToggleStatus}
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                viewMode={viewMode}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* Modal */}
      <GroupModal
        group={selectedGroup}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGroup(null)
        }}
        onSubmit={handleSubmit}
        isLoading={createGroupMutation.isLoading || updateGroupMutation.isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${deleteConfirmation.groupName}"? This action cannot be undone and will remove all group members and associated data.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteGroupMutation.isLoading}
      />
    </div>
  )
}

export default Groups