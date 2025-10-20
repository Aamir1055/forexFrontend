import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ListBulletIcon
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
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
    const group = groupsData?.data?.find((g: Group) => g.id === id)
    setDeleteConfirmation({
      isOpen: true,
      groupId: id,
      groupName: group?.name || 'Unknown Group'
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
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500 mt-1">Manage trading groups</p>
        </div>
        <div className="text-sm text-gray-500">
          {pagination?.total || 0} total
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || Object.keys(filters).length > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
              {Object.keys(filters).length > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Refresh */}
            <button
              onClick={() => queryClient.invalidateQueries(['groups'])}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>

            {/* Create Group */}
            <button
              onClick={handleCreateGroup}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.is_active === undefined ? '' : filters.is_active ? 'active' : 'inactive'}
                    onChange={(e) => handleFilterChange({
                      ...filters,
                      is_active: e.target.value === '' ? undefined : e.target.value === 'active'
                    })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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