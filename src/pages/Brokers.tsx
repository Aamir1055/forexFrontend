import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { BuildingOfficeIcon } from '@heroicons/react/24/solid'
import { brokerService } from '../services/brokerService'
import { brokerRightsService } from '../services/brokerRightsService'
import BrokerTable from '../components/BrokerTable'
import BrokerModal from '../components/BrokerModal'
import GlobalRightsSyncModal from '../components/GlobalRightsSyncModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { Broker, CreateBrokerData, UpdateBrokerData, BrokerFilters } from '../types'
import toast from 'react-hot-toast'
import { useDarkMode } from '../contexts/DarkModeContext'
import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'

const Brokers: React.FC = () => {
  const { isDarkMode } = useDarkMode()
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGlobalSyncModalOpen, setIsGlobalSyncModalOpen] = useState(false)
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    brokerId: number | null
    brokerName: string
  }>({
    isOpen: false,
    brokerId: null,
    brokerName: ''
  })
  const [isSyncingGlobalRights, setIsSyncingGlobalRights] = useState(false)
  
  // Client-side sorting state for count fields
  const [clientSideSort, setClientSideSort] = useState<{
    field: string | null
    order: 'ASC' | 'DESC'
  }>({
    field: null,
    order: 'ASC'
  })

  const [filters, setFilters] = useState<BrokerFilters>({
    sort_by: 'created_at',
    sort_order: 'DESC'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()

  // Fetch brokers
  const { data: brokersData, isLoading, error, refetch } = useQuery(
    ['brokers', currentPage, pageSize, filters, searchTerm],
    () => {
      // For "All" option or large numbers, fetch a large batch
      const fetchSize = pageSize > 100 ? 1000 : pageSize
      return brokerService.getBrokers(currentPage, fetchSize, { ...filters, search: searchTerm })
    },
    {
      keepPreviousData: true,
      retry: false, // Don't retry on permission errors
      onError: (err: any) => {
        // Silently handle 403 errors - we'll show UI message instead
        if (err?.response?.status === 403) {
          console.warn('Access denied to brokers module')
        } else if (err?.response?.status === 401) {
          toast.error('Session expired. Please log in again.')
        }
      }
    }
  )

  // Create broker mutation
  const createBrokerMutation = useMutation(
    (brokerData: CreateBrokerData) => brokerService.createBroker(brokerData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['brokers'])
        setIsModalOpen(false)
        toast.success('Broker created successfully!')
      },
      onError: (error: any) => {
        console.error('Create broker error:', error)
        if (error.response?.status === 403) {
          toast.error('Access denied: You do not have permission to create brokers. Please contact your administrator.')
        } else if (error.response?.status === 401) {
          toast.error('Authentication required: Please log in again.')
        } else {
          toast.error(error.response?.data?.message || 'Failed to create broker')
        }
      }
    }
  )

  // Update broker mutation
  const updateBrokerMutation = useMutation(
    ({ id, brokerData }: { id: number; brokerData: UpdateBrokerData }) =>
      brokerService.updateBroker(id, brokerData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['brokers'])
        setIsModalOpen(false)
        setEditingBroker(null)
        toast.success('Broker updated successfully!')
      },
      onError: (error: any) => {
        console.error('Update broker error:', error)
        if (error.response?.status === 403) {
          toast.error('Access denied: You do not have permission to update brokers. Please contact your administrator.')
        } else if (error.response?.status === 401) {
          toast.error('Authentication required: Please log in again.')
        } else {
          toast.error(error.response?.data?.message || 'Failed to update broker')
        }
      }
    }
  )

  // Delete broker mutation
  const deleteBrokerMutation = useMutation(
    (id: number) => brokerService.deleteBroker(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['brokers'])
        toast.success('Broker deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete broker')
      }
    }
  )

  // Toggle broker status mutation
  const toggleStatusMutation = useMutation(
    (id: number) => brokerService.toggleBrokerStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['brokers'])
        toast.success('Broker status updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update broker status')
      }
    }
  )

  const handleCreateBroker = () => {
    setEditingBroker(null)
    setIsModalOpen(true)
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['brokers'])
    await refetch()
    toast.success('Brokers list refreshed!')
  }

  const handleEditBroker = (broker: Broker) => {
    setEditingBroker(broker)
    setIsModalOpen(true)
  }

  const handleDeleteBroker = (id: number) => {
    const broker = brokersData?.brokers?.find((b: Broker) => b.id === id)
    setDeleteConfirmation({
      isOpen: true,
      brokerId: id,
      brokerName: broker?.full_name || 'Unknown Broker'
    })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.brokerId) {
      deleteBrokerMutation.mutate(deleteConfirmation.brokerId)
      setDeleteConfirmation({ isOpen: false, brokerId: null, brokerName: '' })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, brokerId: null, brokerName: '' })
  }

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id)
  }

  const handleSubmit = async (data: CreateBrokerData | UpdateBrokerData) => {
    if (editingBroker) {
      return await updateBrokerMutation.mutateAsync({ id: editingBroker.id, brokerData: data as UpdateBrokerData })
    } else {
      return await createBrokerMutation.mutateAsync(data as CreateBrokerData)
    }
  }

  const handleFilterChange = (newFilters: Partial<BrokerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleSort = (sortBy: string) => {
    // Client-side sorting for count fields (backend doesn't support these)
    const clientSortFields = ['clients_count', 'group_mappings_count', 'rights_count']
    
    if (clientSortFields.includes(sortBy)) {
      const newSortOrder = clientSideSort.field === sortBy && clientSideSort.order === 'ASC' ? 'DESC' : 'ASC'
      setClientSideSort({ field: sortBy, order: newSortOrder })
      // Clear server-side sort
      setFilters(prev => ({ ...prev, sort_by: undefined, sort_order: undefined }))
    } else {
      // Server-side sorting for other fields
      const newSortOrder = filters.sort_by === sortBy && filters.sort_order === 'ASC' ? 'DESC' : 'ASC'
      handleFilterChange({ sort_by: sortBy, sort_order: newSortOrder })
      // Clear client-side sort
      setClientSideSort({ field: null, order: 'ASC' })
    }
  }

  // Reset to page 1 when pageSize changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  const handleGlobalRightsSync = async (rightIds: number[]) => {
    if (!brokersData?.brokers || brokersData.brokers.length === 0) {
      toast.error('No brokers available to sync')
      return
    }

    setIsSyncingGlobalRights(true)
    const totalBrokers = brokersData.brokers.length
    let successCount = 0
    let errorCount = 0
    let addedRightsCount = 0

    try {
      const syncPromises = brokersData.brokers.map(async (broker: Broker) => {
        try {
          // First, get the broker's existing rights
          const existingRights = await brokerRightsService.getBrokerRights(broker.id)
          const existingRightIds = existingRights.map(r => r.id)
          
          // Find rights that need to be added (not already assigned)
          const rightsToAdd = rightIds.filter(rightId => !existingRightIds.includes(rightId))
          
          if (rightsToAdd.length > 0) {
            // Add each new right individually
            await Promise.all(
              rightsToAdd.map(rightId => 
                brokerRightsService.assignRightToBroker(broker.id, rightId)
              )
            )
            addedRightsCount += rightsToAdd.length
          }
          
          successCount++
          return { success: true, brokerId: broker.id, added: rightsToAdd.length }
        } catch (error) {
          errorCount++
          console.error(`Failed to sync rights for broker ${broker.id}:`, error)
          return { success: false, brokerId: broker.id, added: 0 }
        }
      })

      await Promise.all(syncPromises)

      // Refresh broker data to show updated rights
      queryClient.invalidateQueries(['brokers'])

      if (successCount === totalBrokers) {
        toast.success(`✅ Successfully added ${addedRightsCount} new rights to ${totalBrokers} brokers!`)
      } else if (successCount > 0) {
        toast.success(`Added ${addedRightsCount} new rights to ${successCount}/${totalBrokers} brokers. ${errorCount} failed.`, {
          duration: 5000
        })
      } else {
        toast.error(`Failed to sync rights to all brokers. Please try again.`)
      }
    } catch (error) {
      console.error('Global rights sync error:', error)
      toast.error('An unexpected error occurred during sync')
    } finally {
      setIsSyncingGlobalRights(false)
    }
  }

  // Generate dynamic pagination options based on total items
  const totalItems = brokersData?.pagination?.total || 0
  const paginationOptions = useMemo(() => {
    const options = []
    const baseOptions = [10, 25, 50, 100]
    
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

  // Apply client-side sorting for count fields
  const sortedBrokers = useMemo(() => {
    if (!brokersData?.brokers) return []
    
    const brokers = [...brokersData.brokers]
    
    // Only apply client-side sort if a count field is selected
    if (clientSideSort.field) {
      brokers.sort((a: Broker, b: Broker) => {
        let aValue = 0
        let bValue = 0
        
        switch (clientSideSort.field) {
          case 'clients_count':
            aValue = a.clients_count || 0
            bValue = b.clients_count || 0
            break
          case 'group_mappings_count':
            aValue = a.group_mappings_count || 0
            bValue = b.group_mappings_count || 0
            break
          case 'rights_count':
            aValue = a.rights_count || 0
            bValue = b.rights_count || 0
            break
        }
        
        if (clientSideSort.order === 'ASC') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      })
    }
    
    return brokers
  }, [brokersData?.brokers, clientSideSort])

  // Check if error is 403 (permission denied)
  if (error) {
    const is403 = (error as any)?.response?.status === 403
    
    if (is403) {
      return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
            : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20'
        }`}>
          <div className={`max-w-md w-full mx-4 p-8 rounded-xl border shadow-xl text-center ${
            isDarkMode 
              ? 'bg-slate-800/80 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Access Denied
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              You don't have permission to view brokers. Please contact your administrator for access.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading brokers. Please try again.</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20'
    }`}>
      {/* Compact Header with Glass Effect */}
      <div className="px-4 pt-3 pb-2">
        <header className={`backdrop-blur-xl border rounded-xl shadow-lg transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-800/80 border-slate-700/60 shadow-black/20' 
            : 'bg-white/80 border-white/60 shadow-blue-500/5'
        }`}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                    <BuildingOfficeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
                  }`}>
                    Broker Management
                  </h1>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Manage brokers and their permissions
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, username..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className={`w-72 pl-9 pr-9 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearch('')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-slate-600 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 border rounded-lg transition-colors flex items-center gap-2 text-sm ${
                    isDarkMode 
                      ? 'border-slate-600 hover:bg-slate-700/50 text-slate-200' 
                      : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                <button
                  onClick={() => setIsGlobalSyncModalOpen(true)}
                  disabled={!brokersData?.brokers || brokersData.brokers.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 font-semibold text-xs group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sync rights to all brokers at once"
                >
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Rights to All</span>
                </button>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-slate-500/30 hover:shadow-xl hover:shadow-slate-500/40 font-semibold text-xs group"
                  title="Refresh brokers list"
                >
                  <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Refresh</span>
                </button>
                <PermissionGate module={MODULES.BROKERS} action="create">
                  <button
                    onClick={handleCreateBroker}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold text-xs group"
                  >
                    <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add Broker</span>
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Filter Modal Overlay - Rendered outside header */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              style={{ zIndex: 10000 }}
              onClick={() => setShowFilters(false)}
            />
            
            {/* Filter Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`fixed top-20 left-1/2 -translate-x-1/2 w-[450px] max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border shadow-2xl p-6 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}
              style={{ zIndex: 10001 }}
              onClick={(e) => e.stopPropagation()}
            >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`font-semibold ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>Filters</h3>
                          <button
                            onClick={() => setShowFilters(false)}
                            className={`hover:text-slate-600 ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-400'
                            }`}
                          >
                            ×
                          </button>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Status</label>
                          <select
                            value={filters.is_active?.toString() || 'all'}
                            onChange={(e) => handleFilterChange({ 
                              is_active: e.target.value === 'all' ? undefined : e.target.value === 'true' 
                            })}
                            className={`w-full px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700/50 border-slate-600 text-slate-200' 
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="all">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>

                        {/* Rights Filter */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Rights</label>
                          <select
                            value={filters.has_rights?.toString() || 'all'}
                            onChange={(e) => handleFilterChange({ 
                              has_rights: e.target.value === 'all' ? undefined : e.target.value === 'true' 
                            })}
                            className={`w-full px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700/50 border-slate-600 text-slate-200' 
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="all">All Rights</option>
                            <option value="true">Has Rights</option>
                            <option value="false">No Rights</option>
                          </select>
                        </div>

                        {/* Account Range From */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Account Range From</label>
                          <input
                            type="number"
                            placeholder="e.g. 1000"
                            value={filters.account_range_from || ''}
                            onChange={(e) => handleFilterChange({ 
                              account_range_from: e.target.value ? Number(e.target.value) : undefined 
                            })}
                            className={`w-full px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400' 
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            }`}
                          />
                        </div>

                        {/* Account Range To */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Account Range To</label>
                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={filters.account_range_to || ''}
                            onChange={(e) => handleFilterChange({ 
                              account_range_to: e.target.value ? Number(e.target.value) : undefined 
                            })}
                            className={`w-full px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400' 
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            }`}
                          />
                        </div>

                        {/* Created Date From */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Created From</label>
                          <input
                            type="date"
                            value={filters.created_from || ''}
                            onChange={(e) => handleFilterChange({ 
                              created_from: e.target.value || undefined 
                            })}
                            className={`w-full px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700/50 border-slate-600 text-slate-200' 
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>

                        {/* Created Date To */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Created To</label>
                          <input
                            type="date"
                            value={filters.created_to || ''}
                            onChange={(e) => handleFilterChange({ 
                              created_to: e.target.value || undefined 
                            })}
                            className={`w-full px-2 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                              isDarkMode 
                                ? 'bg-slate-700/50 border-slate-600 text-slate-200' 
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>

                        {/* Actions */}
                        <div className={`flex items-center justify-between pt-3 border-t transition-colors ${
                          isDarkMode ? 'border-slate-700' : 'border-slate-200'
                        }`}>
                          <button
                            onClick={() => {
                              setFilters({ sort_by: 'created_at', sort_order: 'DESC' })
                              setSearchTerm('')
                            }}
                            className={`text-xs hover:text-slate-800 transition-colors ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            Clear All
                          </button>
                          <button
                            onClick={() => setShowFilters(false)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-md hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="px-4 pb-4">
        <div>

          {/* Pagination dropdown */}
          <div className="mt-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs transition-colors ${
                  isDarkMode 
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
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>entries</span>
            </div>
            <div className={`text-xs transition-colors ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Showing {brokersData?.pagination.total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, brokersData?.pagination.total || 0)} of {brokersData?.pagination.total || 0} results
            </div>
            {brokersData?.pagination && brokersData.pagination.pages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 border rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'border-slate-600 hover:bg-slate-700/50' 
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className={`text-xs transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Page {currentPage} of {brokersData.pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(brokersData.pagination.pages, prev + 1))}
                  disabled={currentPage === brokersData.pagination.pages}
                  className={`px-2 py-1 border rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
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

          {/* Brokers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <BrokerTable
              brokers={sortedBrokers}
              isLoading={isLoading}
              onEdit={handleEditBroker}
              onDelete={handleDeleteBroker}
              onToggleStatus={handleToggleStatus}
              onSort={handleSort}
              currentSort={{ 
                field: clientSideSort.field || filters.sort_by || 'created_at', 
                order: clientSideSort.field ? clientSideSort.order : (filters.sort_order || 'DESC')
              }}
              pagination={brokersData?.pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </motion.div>
        </div>
      </main>

      {/* Broker Modal */}
      {isModalOpen && (
        <BrokerModal
          broker={editingBroker}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingBroker(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createBrokerMutation.isLoading || updateBrokerMutation.isLoading}
        />
      )}

      {/* Global Rights Sync Modal */}
      <GlobalRightsSyncModal
        isOpen={isGlobalSyncModalOpen}
        onClose={() => setIsGlobalSyncModalOpen(false)}
        onSync={handleGlobalRightsSync}
        isLoading={isSyncingGlobalRights}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Broker"
        message={`Are you sure you want to delete the broker "${deleteConfirmation.brokerName}"? This action cannot be undone and will permanently remove all broker data, account mappings, and associated records.`}
        confirmText="Delete Broker"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteBrokerMutation.isLoading}
      />
    </div>
  )
}

export default Brokers