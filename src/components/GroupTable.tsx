import React from 'react'
import { motion } from 'framer-motion'
import { 
  PencilIcon, 
  TrashIcon, 
  PowerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ServerIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Group } from '../types'

interface GroupTableProps {
  groups: Group[]
  isLoading: boolean
  onEdit: (group: Group) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  currentPage: number
  onPageChange: (page: number) => void
  viewMode: 'table' | 'grid'
}

const GroupTable: React.FC<GroupTableProps> = ({
  groups,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  pagination,
  currentPage,
  onPageChange,
  viewMode
}) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
        <ServerIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No groups found</h3>
        <p className="text-sm text-gray-500">Create your first trading group to get started.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getGroupTypeColor = (mt5Group: string) => {
    if (mt5Group.toLowerCase().includes('demo')) {
      return 'bg-blue-100 text-blue-800'
    } else if (mt5Group.toLowerCase().includes('real')) {
      return 'bg-green-100 text-green-800'
    } else if (mt5Group.toLowerCase().includes('vip') || mt5Group.toLowerCase().includes('premium')) {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {group.broker_view_group}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    group.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {group.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* MT5 Group */}
                <div className="mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getGroupTypeColor(group.mt5_group)}`}>
                    {group.mt5_group}
                  </span>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {group.description}
                  </p>
                </div>

                {/* Created Date */}
                <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Created {formatDate(group.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEdit(group)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onToggleStatus(group.id)}
                      className={`group relative p-2.5 text-gray-400 hover:text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                        group.is_active 
                          ? 'hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600' 
                          : 'hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600'
                      }`}
                      title={group.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <PowerIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                    <button
                      onClick={() => onDelete(group.id)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination for Grid */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              
              {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= pagination.total_pages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Table View
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Mobile view */}
      <div className="block lg:hidden">
        <div className="divide-y divide-gray-200">
          {groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{group.broker_view_group}</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(group.mt5_group)}`}>
                        {group.mt5_group}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        group.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {group.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{group.description}</p>
                    <p className="text-xs text-gray-500">Created {formatDate(group.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => onEdit(group)}
                    className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onToggleStatus(group.id)}
                    className={`group relative p-2.5 text-gray-400 hover:text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                      group.is_active 
                        ? 'hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600' 
                        : 'hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600'
                    }`}
                  >
                    <PowerIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </button>
                  <button
                    onClick={() => onDelete(group.id)}
                    className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Group</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">MT5 Group</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {groups.map((group, index) => (
              <motion.tr
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{group.broker_view_group}</p>
                </td>
                
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getGroupTypeColor(group.mt5_group)}`}>
                    {group.mt5_group}
                  </span>
                </td>
                
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-900 max-w-xs truncate" title={group.description}>
                    {group.description}
                  </p>
                </td>
                
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    group.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {group.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                
                <td className="px-4 py-3 text-xs text-gray-500">
                  {formatDate(group.created_at)}
                </td>
                
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEdit(group)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        Edit
                      </div>
                    </button>
                    <button
                      onClick={() => onToggleStatus(group.id)}
                      className={`group relative p-2.5 text-gray-400 hover:text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                        group.is_active 
                          ? 'hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600' 
                          : 'hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600'
                      }`}
                      title={group.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <PowerIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        {group.is_active ? 'Deactivate' : 'Activate'}
                      </div>
                    </button>
                    <button
                      onClick={() => onDelete(group.id)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        Delete
                      </div>
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pagination.total_pages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupTable