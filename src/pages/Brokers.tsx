import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { BuildingOfficeIcon } from '@heroicons/react/24/solid'
import { brokerService } from '../services/brokerService'
import BrokerTable from '../components/BrokerTable'
import BrokerModal from '../components/BrokerModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { Broker, CreateBrokerData, UpdateBrokerData, BrokerFilters } from '../types'
import toast from 'react-hot-toast'

const Brokers: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
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


  const [filters, setFilters] = useState<BrokerFilters>({
    sort_by: 'created_at',
    sort_order: 'DESC'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()

  // Fetch brokers
  const { data: brokersData, isLoading, error } = useQuery(
    ['brokers', currentPage, pageSize, filters, searchTerm],
    () => brokerService.getBrokers(currentPage, pageSize, { ...filters, search: searchTerm }),
    {
      keepPreviousData: true,
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
    const newSortOrder = filters.sort_by === sortBy && filters.sort_order === 'ASC' ? 'DESC' : 'ASC'
    handleFilterChange({ sort_by: sortBy, sort_order: newSortOrder })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading brokers. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Broker Management</h1>
                  <p className="text-sm text-gray-500">Manage brokers and their permissions</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, username..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <FunnelIcon className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  
                  {/* Filter Dropdown */}
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-lg z-50 p-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Filters</h3>
                          <button
                            onClick={() => setShowFilters(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={filters.is_active?.toString() || 'all'}
                            onChange={(e) => handleFilterChange({ 
                              is_active: e.target.value === 'all' ? undefined : e.target.value === 'true' 
                            })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="all">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>

                        {/* Rights Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Rights</label>
                          <select
                            value={filters.has_rights?.toString() || 'all'}
                            onChange={(e) => handleFilterChange({ 
                              has_rights: e.target.value === 'all' ? undefined : e.target.value === 'true' 
                            })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="all">All Rights</option>
                            <option value="true">Has Rights</option>
                            <option value="false">No Rights</option>
                          </select>
                        </div>

                        {/* Account Range From */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Account Range From</label>
                          <input
                            type="number"
                            placeholder="e.g. 1000"
                            value={filters.account_range_from || ''}
                            onChange={(e) => handleFilterChange({ 
                              account_range_from: e.target.value ? Number(e.target.value) : undefined 
                            })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Account Range To */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Account Range To</label>
                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={filters.account_range_to || ''}
                            onChange={(e) => handleFilterChange({ 
                              account_range_to: e.target.value ? Number(e.target.value) : undefined 
                            })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Created Date From */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Created From</label>
                          <input
                            type="date"
                            value={filters.created_from || ''}
                            onChange={(e) => handleFilterChange({ 
                              created_from: e.target.value || undefined 
                            })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Created Date To */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Created To</label>
                          <input
                            type="date"
                            value={filters.created_to || ''}
                            onChange={(e) => handleFilterChange({ 
                              created_to: e.target.value || undefined 
                            })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setFilters({ sort_by: 'created_at', sort_order: 'DESC' })
                              setSearchTerm('')
                            }}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Clear All
                          </button>
                          <button
                            onClick={() => setShowFilters(false)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <button
                  onClick={handleCreateBroker}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create Broker</span>
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
          <div className="mt-3 mb-2 flex items-center justify-between">
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
                <option value={9999}>All</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs text-gray-600">entries</span>
            </div>
            <div className="text-xs text-gray-700">
              Showing {brokersData?.pagination.total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, brokersData?.pagination.total || 0)} of {brokersData?.pagination.total || 0} results
            </div>
            {brokersData?.pagination && brokersData.pagination.pages > 1 && (
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
                  Page {currentPage} of {brokersData.pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(brokersData.pagination.pages, prev + 1))}
                  disabled={currentPage === brokersData.pagination.pages}
                  className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              brokers={brokersData?.brokers || []}
              isLoading={isLoading}
              onEdit={handleEditBroker}
              onDelete={handleDeleteBroker}
              onToggleStatus={handleToggleStatus}
              onSort={handleSort}
              currentSort={{ field: filters.sort_by || 'created_at', order: filters.sort_order || 'DESC' }}
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