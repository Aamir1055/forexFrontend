import React from 'react'
import { 
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { User, PaginationInfo } from '../services/userService'
import { PermissionGate } from './PermissionGate'
import { MODULES } from '../utils/permissions'

interface UserTableProps {
  users: User[]
  isLoading: boolean
  onEdit: (user: User) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
  onSort?: (field: string) => void
  currentSort?: { field: string; order: 'ASC' | 'DESC' }
  pagination?: PaginationInfo
  currentPage: number
  onPageChange: (page: number) => void
  isDarkMode?: boolean
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onSort,
  currentSort,
  pagination,
  currentPage,
  onPageChange,
  isDarkMode = false
}) => {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className={`backdrop-blur-xl rounded-xl border shadow-xl ${
        isDarkMode 
          ? 'bg-slate-800/80 border-slate-700/60 shadow-black/20' 
          : 'bg-white/80 border-white/60 shadow-blue-500/5'
      }`}>
        <div className="p-12 text-center">
          <div className="relative inline-flex">
            <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
              isDarkMode 
                ? 'border-slate-700 border-t-blue-500' 
                : 'border-slate-200 border-t-blue-600'
            }`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`h-6 w-6 rounded-full ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-600/10'}`}></div>
            </div>
          </div>
          <p className={`font-semibold mt-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Loading users...</p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Please wait while we fetch the data</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={`backdrop-blur-xl rounded-xl border shadow-xl ${
        isDarkMode 
          ? 'bg-slate-800/80 border-slate-700/60 shadow-black/20' 
          : 'bg-white/80 border-white/60 shadow-blue-500/5'
      }`}>
        <div className="p-16 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-800' 
              : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100'
          }`}>
            <UserGroupIcon className={`w-8 h-8 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No users found</h3>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Get started by creating your first user or adjust your filters.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Compact Table with Glass Effect */}
      <div className={`backdrop-blur-xl rounded-xl border shadow-xl overflow-hidden ${
        isDarkMode 
          ? 'bg-slate-800/80 border-slate-700/60 shadow-black/20' 
          : 'bg-white/80 border-white/60 shadow-blue-500/5'
      }`}>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${
              isDarkMode 
                ? 'bg-gradient-to-r from-slate-900/50 to-blue-900/20 border-slate-700' 
                : 'bg-gradient-to-r from-slate-50 to-blue-50/30 border-slate-200'
            }`}>
              <th 
                onClick={() => onSort?.('username')}
                className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                } ${onSort ? 'cursor-pointer hover:bg-opacity-50 transition-colors' : ''}`}
                title={onSort ? 'Click to sort' : ''}
              >
                <div className="flex items-center gap-1">
                  <span>User</span>
                  {currentSort?.field === 'username' && (
                    <span className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('email')}
                className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                } ${onSort ? 'cursor-pointer hover:bg-opacity-50 transition-colors' : ''}`}
                title={onSort ? 'Click to sort' : ''}
              >
                <div className="flex items-center gap-1">
                  <span>Email</span>
                  {currentSort?.field === 'email' && (
                    <span className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>Roles</th>
              <th 
                onClick={() => onSort?.('is_active')}
                className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                } ${onSort ? 'cursor-pointer hover:bg-opacity-50 transition-colors' : ''}`}
                title={onSort ? 'Click to sort' : ''}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {currentSort?.field === 'is_active' && (
                    <span className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('created_at')}
                className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                } ${onSort ? 'cursor-pointer hover:bg-opacity-50 transition-colors' : ''}`}
                title={onSort ? 'Click to sort' : ''}
              >
                <div className="flex items-center gap-1">
                  <span>Created</span>
                  {currentSort?.field === 'created_at' && (
                    <span className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className={`px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDarkMode 
              ? 'bg-slate-800/50 divide-slate-700/50' 
              : 'bg-white divide-slate-100'
          }`}>
            {users.map((user, index) => (
              <tr key={user.id} className={`transition-all duration-200 group ${
                isDarkMode 
                  ? 'hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-purple-900/20' 
                  : 'hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20'
              }`}>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img 
                        src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(index % 5) + 1}.jpg`} 
                        alt="Avatar" 
                        className="w-7 h-7 rounded-lg border-2 border-white shadow-sm group-hover:scale-110 transition-transform duration-200"
                      />
                      {user.is_active && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user.username}</div>
                      <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>@{user.username.toLowerCase().replace(/\s+/g, '')}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{user.email}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex gap-1 flex-wrap max-w-xs">
                    {user.roles.slice(0, 2).map((role) => (
                      <span
                        key={role.id}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-sm ${
                          role.name.toLowerCase() === 'admin' 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : role.name.toLowerCase() === 'editor'
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : role.name.toLowerCase() === 'viewer'
                            ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                            : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                        }`}
                      >
                        {role.name}
                      </span>
                    ))}
                    {user.roles.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 shadow-sm">
                        +{user.roles.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <PermissionGate 
                    module={MODULES.USERS} 
                    action="edit"
                    fallback={
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    }
                  >
                    <label className="relative inline-flex items-center cursor-pointer group/toggle">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={user.is_active}
                        onChange={() => onToggleStatus(user.id)}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600"></div>
                    </label>
                  </PermissionGate>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-slate-600 font-medium">{formatDate(user.created_at)}</span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <PermissionGate module={MODULES.USERS} action="edit">
                      <button 
                        onClick={() => onEdit(user)}
                        className="group/btn relative p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-100 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/50 hover:scale-110"
                        title="Edit user"
                      >
                        <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </PermissionGate>
                    <PermissionGate module={MODULES.USERS} action="delete">
                      <button 
                        onClick={() => onDelete(user.id)}
                        className="group/btn relative p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-100 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-md hover:shadow-red-500/50 hover:scale-110"
                        title="Delete user"
                      >
                        <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserTable