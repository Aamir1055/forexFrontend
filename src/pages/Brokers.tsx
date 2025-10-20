import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { BuildingOfficeIcon, UserGroupIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/solid'
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
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
      brokerName: broker?.name || 'Unknown Broker'
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
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <img 
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" 
                  alt="User" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">



          {/* Filters & Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            {/* Main Filter Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Quick Filters */}
                  <select
                    value={filters.is_active?.toString() || 'all'}
                    onChange={(e) => handleFilterChange({ 
                      is_active: e.target.value === 'all' ? undefined : e.target.value === 'true' 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>

                  <select
                    value={filters.has_rights?.toString() || 'all'}
                    onChange={(e) => handleFilterChange({ 
                      has_rights: e.target.value === 'all' ? undefined : e.target.value === 'true' 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Rights</option>
                    <option value="true">Has Rights</option>
                    <option value="false">No Rights</option>
                  </select>

                  <select
                    value={filters.sort_by || 'created_at'}
                    onChange={(e) => handleFilterChange({ sort_by: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created_at">Sort by Created</option>
                    <option value="username">Sort by Username</option>
                    <option value="full_name">Sort by Name</option>
                    <option value="email">Sort by Email</option>
                    <option value="last_login_at">Sort by Last Login</option>
                    <option value="id">Sort by ID</option>
                  </select>

                  <button
                    onClick={() => handleFilterChange({ 
                      sort_order: filters.sort_order === 'ASC' ? 'DESC' : 'ASC' 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    {filters.sort_order === 'ASC' ? '↑ ASC' : '↓ DESC'}
                  </button>

                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <FunnelIcon className="w-4 h-4" />
                    <span>Advanced</span>
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>

                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={handleCreateBroker}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Create Broker</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-50 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Account Range From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Range From
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={filters.account_range_from || ''}
                      onChange={(e) => handleFilterChange({ 
                        account_range_from: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Account Range To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Range To
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={filters.account_range_to || ''}
                      onChange={(e) => handleFilterChange({ 
                        account_range_to: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Created Date From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created From
                    </label>
                    <input
                      type="date"
                      value={filters.created_from || ''}
                      onChange={(e) => handleFilterChange({ 
                        created_from: e.target.value || undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Created Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created To
                    </label>
                    <input
                      type="date"
                      value={filters.created_to || ''}
                      onChange={(e) => handleFilterChange({ 
                        created_to: e.target.value || undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {Object.keys(filters).filter(key => filters[key] !== undefined && filters[key] !== '').length > 2 && (
                      <span>
                        {Object.keys(filters).filter(key => filters[key] !== undefined && filters[key] !== '').length - 2} active filters
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setFilters({ sort_by: 'created_at', sort_order: 'DESC' })
                        setSearchTerm('')
                        setCurrentPage(1)
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, brokersData?.pagination.total || 0)} of {brokersData?.pagination.total || 0} brokers
              </p>
              
              {/* Active Filters */}
              {(searchTerm || Object.keys(filters).filter(key => 
                filters[key] !== undefined && 
                filters[key] !== '' && 
                key !== 'sort_by' && 
                key !== 'sort_order'
              ).length > 0) && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => handleSearch('')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.is_active !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Status: {filters.is_active ? 'Active' : 'Inactive'}
                      <button
                        onClick={() => handleFilterChange({ is_active: undefined })}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.has_rights !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Rights: {filters.has_rights ? 'Has Rights' : 'No Rights'}
                      <button
                        onClick={() => handleFilterChange({ has_rights: undefined })}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(filters.account_range_from || filters.account_range_to) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Range: {filters.account_range_from || '0'} - {filters.account_range_to || '∞'}
                      <button
                        onClick={() => handleFilterChange({ account_range_from: undefined, account_range_to: undefined })}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Page {currentPage} of {brokersData?.pagination.pages || 1}
            </div>
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