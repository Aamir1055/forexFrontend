import React, { useState, useEffect } from 'react'
import { 
  PencilIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Broker } from '../types'

import { brokerRightsService } from '../services/brokerRightsService'
import { PermissionGate } from './PermissionGate'
import { MODULES } from '../utils/permissions'

interface BrokerTableProps {
  brokers: Broker[]
  isLoading: boolean
  onEdit: (broker: Broker) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
  onSort: (field: string) => void
  currentSort: { field: string; order: 'ASC' | 'DESC' }
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  currentPage: number
  onPageChange: (page: number) => void
}

const BrokerTable: React.FC<BrokerTableProps> = ({
  brokers,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onSort,
  currentSort,
  pagination,
  currentPage,
  onPageChange
}) => {
    const [brokerRights, setBrokerRights] = useState<{ [key: number]: number }>({})
  const [loadingRights, setLoadingRights] = useState<{ [key: number]: boolean }>({})

  // Fetch rights count for brokers efficiently - all at once in parallel
  useEffect(() => {
    const fetchAllRightsCount = async () => {
      if (brokers.length === 0) return

      // Fetch all broker rights in parallel
      const rightsPromises = brokers.map(async (broker) => {
        setLoadingRights(prev => ({ ...prev, [broker.id]: true }))
        
        try {
          const rights = await brokerRightsService.getBrokerRights(broker.id)
          return { brokerId: broker.id, count: rights.length }
        } catch (error) {
          // Silently fail for individual brokers
          return { brokerId: broker.id, count: 0 }
        } finally {
          setLoadingRights(prev => ({ ...prev, [broker.id]: false }))
        }
      })

      // Wait for all requests to complete
      const results = await Promise.all(rightsPromises)
      
      // Update state with all results at once
      const rightsData = results.reduce((acc, { brokerId, count }) => {
        acc[brokerId] = count
        return acc
      }, {} as { [key: number]: number })
      
      setBrokerRights(rightsData)
    }

    fetchAllRightsCount()
  }, [brokers])

  const getRightsDisplay = (brokerId: number) => {
    if (loadingRights[brokerId]) {
      return <span className="text-xs animate-pulse text-purple-400">...</span>
    }
    return brokerRights[brokerId] ?? 0
  }

  if (isLoading) {
    return (
      <div className={`backdrop-blur-xl rounded-xl border shadow-lg transition-colors ${
        false 
          ? 'bg-slate-800/80 border-slate-700/60' 
          : 'bg-white/80 border-white/60'
      }`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`backdrop-blur-xl rounded-xl border shadow-lg overflow-hidden transition-colors ${
      false 
        ? 'bg-slate-800/80 border-slate-700/60' 
        : 'bg-white/80 border-white/60'
    }`}>
      {/* Mobile view */}
      <div className="block sm:hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {brokers.map((broker) => (
              <div key={broker.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{broker.full_name || 'Unnamed Broker'}</h3>
                    <p className="text-sm text-gray-500">{broker.email || 'No email'}</p>
                    <p className="text-sm text-gray-500">{broker.phone}</p>
                    <p className="text-sm text-gray-500">Range: {broker.account_range_from} - {broker.account_range_to}</p>
                    <div className="mt-2 flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-600">Status:</span>
                        <PermissionGate module={MODULES.BROKERS} action="edit">
                          <label className="relative inline-flex items-center cursor-pointer group/toggle">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={broker.is_active}
                              onChange={() => onToggleStatus(broker.id)}
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600"></div>
                          </label>
                        </PermissionGate>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        @{broker.username}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PermissionGate module={MODULES.BROKERS} action="edit">
                      <button
                        onClick={() => onEdit(broker)}
                        className="p-1 text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </PermissionGate>
                    <PermissionGate module={MODULES.BROKERS} action="delete">
                      <button
                        onClick={() => onDelete(broker.id)}
                        className="p-1 text-red-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className={`backdrop-blur-xl rounded-xl border shadow-lg overflow-hidden transition-colors ${
        false 
          ? 'bg-slate-800/80 border-slate-700/60' 
          : 'bg-white/80 border-white/60'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b transition-colors ${
              false 
                ? 'bg-slate-700/50 border-slate-600' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th 
                  onClick={() => onSort('full_name')}
                  className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide cursor-pointer transition-colors ${
                    false 
                      ? 'text-slate-300 hover:bg-slate-600/50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Click to sort"
                >
                  <div className="flex items-center space-x-1">
                    <span>Broker</span>
                    {currentSort.field === 'full_name' && (
                      <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => onSort('email')}
                  className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide cursor-pointer transition-colors ${
                    false 
                      ? 'text-slate-300 hover:bg-slate-600/50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Click to sort"
                >
                  <div className="flex items-center space-x-1">
                    <span>Email</span>
                    {currentSort.field === 'email' && (
                      <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide ${
                  'text-gray-600'
                }`}>Phone</th>
                <th 
                  onClick={() => onSort('is_active')}
                  className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide cursor-pointer transition-colors ${
                    false 
                      ? 'text-slate-300 hover:bg-slate-600/50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Click to sort"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {currentSort.field === 'is_active' && (
                      <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => onSort('clients_count')}
                  className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide cursor-pointer transition-colors ${
                    false 
                      ? 'text-slate-300 hover:bg-slate-600/50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Click to sort"
                >
                  <div className="flex items-center space-x-1">
                    <span>Clients</span>
                    {currentSort.field === 'clients_count' && (
                      <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => onSort('group_mappings_count')}
                  className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide cursor-pointer transition-colors ${
                    false 
                      ? 'text-slate-300 hover:bg-slate-600/50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Click to sort"
                >
                  <div className="flex items-center space-x-1">
                    <span>Groups</span>
                    {currentSort.field === 'group_mappings_count' && (
                      <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => onSort('rights_count')}
                  className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide cursor-pointer transition-colors ${
                    false 
                      ? 'text-slate-300 hover:bg-slate-600/50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Click to sort"
                >
                  <div className="flex items-center space-x-1">
                    <span>Rights</span>
                    {currentSort.field === 'rights_count' && (
                      <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide ${
                  'text-gray-600'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brokers.map((broker) => (
                <tr key={broker.id} className={`transition-colors duration-150 ${
                  false ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                }`}>
                  <td className="px-2 py-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {broker.full_name || 'Unnamed Broker'}
                    </p>
                  </td>
                  <td className="px-2 py-2">
                    <p className="text-xs text-gray-700">{broker.email || '-'}</p>
                  </td>
                  <td className="px-2 py-2">
                    <p className="text-xs text-gray-700">{broker.phone || '-'}</p>
                  </td>
                  <td className="px-2 py-2">
                    <PermissionGate module={MODULES.BROKERS} action="edit">
                      <label className="relative inline-flex items-center cursor-pointer group/toggle">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={broker.is_active}
                          onChange={() => onToggleStatus(broker.id)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600"></div>
                      </label>
                    </PermissionGate>
                  </td>
                  <td className="px-2 py-2">
                    <p className="text-xs font-semibold text-blue-600">
                      {broker.clients_count || 0}
                    </p>
                  </td>
                  <td className="px-2 py-2">
                    <p className="text-xs font-semibold text-green-600">
                      {broker.group_mappings_count || 0}
                    </p>
                  </td>
                  <td className="px-2 py-2">
                    <p className="text-xs font-semibold text-purple-600">
                      {getRightsDisplay(broker.id)}
                    </p>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center space-x-1">
                      <PermissionGate module={MODULES.BROKERS} action="edit">
                        <button 
                          onClick={() => onEdit(broker)}
                          className="group relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-md hover:scale-105"
                          title="Edit broker"
                        >
                          <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </PermissionGate>
                      <PermissionGate module={MODULES.BROKERS} action="delete">
                        <button 
                          onClick={() => onDelete(broker.id)}
                          className="group relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-md hover:scale-105"
                          title="Delete broker"
                        >
                          <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600 font-medium">
              Showing <span className="text-blue-600 font-semibold">{(currentPage - 1) * pagination.limit + 1}</span> to <span className="text-blue-600 font-semibold">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of <span className="text-blue-600 font-semibold">{pagination.total}</span> results
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm font-semibold">
                {currentPage}
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 font-medium">2</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 font-medium">3</button>
              <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrokerTable

