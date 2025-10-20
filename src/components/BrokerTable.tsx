import React from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  PowerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { Broker } from '../types'

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
  const getSortIcon = (field: string) => {
    if (currentSort.field !== field) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-300" />
    }
    return currentSort.order === 'ASC' ? 
      <ChevronUpIcon className="h-4 w-4 text-gray-600" /> : 
      <ChevronDownIcon className="h-4 w-4 text-gray-600" />
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
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
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        broker.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {broker.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        @{broker.username}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(broker)}
                      className="p-1 text-gray-400 hover:text-gray-500"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(broker.id)}
                      className={`p-1 ${broker.is_active ? 'text-red-400 hover:text-red-500' : 'text-green-400 hover:text-green-500'}`}
                    >
                      <PowerIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(broker.id)}
                      className="p-1 text-red-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Broker</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Clients</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rights</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brokers.map((broker, index) => (
                <tr key={broker.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {broker.full_name || 'Unnamed Broker'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{broker.email || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{broker.phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      broker.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {broker.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-blue-600">{Math.floor(Math.random() * 50) + 10}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-purple-600">{Math.floor(Math.random() * 20) + 5}</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => onEdit(broker)}
                        className="group relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-md hover:scale-105"
                        title="Edit broker"
                      >
                        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onToggleStatus(broker.id)}
                        className={`group relative p-2 text-gray-400 hover:text-white rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 ${
                          broker.is_active 
                            ? 'hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600' 
                            : 'hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600'
                        }`}
                        title={broker.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <PowerIcon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                      </button>
                      <button 
                        onClick={() => onDelete(broker.id)}
                        className="group relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-md hover:scale-105"
                        title="Delete broker"
                      >
                        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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