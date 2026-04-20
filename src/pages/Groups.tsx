import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { groupService } from '../services/groupService'
import { Group, CreateGroupData, UpdateGroupData, GroupFilters } from '../types'
import GroupTable from '../components/GroupTable'
import GroupModal from '../components/GroupModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'

import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'

const Groups: React.FC = () => {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<GroupFilters>({})
  const [viewMode] = useState<'table' | 'grid'>('table')
  // const [showFilters, setShowFilters] = useState(false)
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
  const { data: groupsData, isLoading, error, refetch } = useQuery(
    ['groups', currentPage, pageSize, searchTerm, filters],
    () => {
      // For "All" option or large numbers, fetch a large batch
      const fetchSize = pageSize > 100 ? 1000 : pageSize
      return groupService.getGroups(currentPage, fetchSize, { 
        ...filters, 
        search: searchTerm || undefined 
      })
    },
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

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['groups'])
    await refetch()
    toast.success('Groups list refreshed!')
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

  const _handleFilterChange = (newFilters: GroupFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const _clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  const groups = groupsData?.groups || []
  const pagination = groupsData?.pagination

  // Generate dynamic pagination options based on total items
  const totalItems = pagination?.total || 0
  const paginationOptions = useMemo(() => {
    const options = []
    const baseOptions = [10, 20, 50, 100]
    
    for (const option of baseOptions) {
      if (option < totalItems) {
        options.push(option)
      }
    }
    
    // Always add "All" option at the end if we have items
    if (totalItems > 0) {
      options.push(totalItems) // Show exact total
    }
    
    // If no options were added (totalItems is very small), add at least one option
    if (options.length === 0 && totalItems > 0) {
      options.push(totalItems)
    }
    
    return options
  }, [totalItems])

  // Reset to page 1 when pageSize changes
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      false 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20'
    }`}>
      {/* Compact Header with Glass Effect */}
      <div className="px-4 pt-3 pb-2">
        <header className={`backdrop-blur-xl border rounded-xl shadow-lg transition-colors duration-300 ${
          false 
            ? 'bg-slate-800/80 border-slate-700/60 shadow-black/20' 
            : 'bg-white/80 border-white/60 shadow-blue-500/5'
        }`}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    false 
                      ? 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
                  }`}>
                    Groups
                  </h1>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    false ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Manage trading groups
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-72 pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                      false 
                        ? 'bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                </div>
                
                <button
                  onClick={handleRefresh}
                  className="px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-slate-500/30 hover:shadow-xl hover:shadow-slate-500/40 font-semibold text-xs group"
                  title="Refresh groups list"
                >
                  <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Refresh</span>
                </button>
                
                <PermissionGate module={MODULES.GROUPS} action="create">
                  <button
                    onClick={handleCreateGroup}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold text-xs group"
                  >
                    <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Create Group</span>
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="px-4 pb-4">
        <div>
          {/* Pagination Controls */}
          {!isLoading && pagination && (
            <div className="mt-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs transition-colors ${
                  false ? 'text-slate-400' : 'text-slate-600'
                }`}>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className={`px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs transition-colors ${
                    false 
                      ? 'bg-slate-700/50 border-slate-600 text-slate-200' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {paginationOptions.map(option => (
                    <option key={option} value={option}>
                      {option === totalItems ? `All (${option})` : option}
                    </option>
                  ))}
                </select>
                <span className={`text-xs transition-colors ${
                  false ? 'text-slate-400' : 'text-slate-600'
                }`}>entries</span>
              </div>
              <div className={`text-xs transition-colors ${
                false ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Showing {pagination.total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
              </div>
              {pagination.total_pages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 border rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      false 
                        ? 'border-slate-600 hover:bg-slate-700/50' 
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className={`text-xs transition-colors ${
                    false ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Page {currentPage} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                    disabled={currentPage === pagination.total_pages}
                    className={`px-2 py-1 border rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      false 
                        ? 'border-slate-600 hover:bg-slate-700/50' 
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
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

