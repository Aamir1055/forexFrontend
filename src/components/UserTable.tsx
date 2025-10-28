import React from 'react'
import { 
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { User, PaginationInfo } from '../services/userService'

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
  onPageChange
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
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-blue-500/5">
        <div className="p-20 text-center">
          <div className="relative inline-flex">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-blue-600/10"></div>
            </div>
          </div>
          <p className="text-slate-600 font-semibold mt-6 text-lg">Loading users...</p>
          <p className="text-slate-400 text-sm mt-2">Please wait while we fetch the data</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-blue-500/5">
        <div className="p-24 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <UserGroupIcon className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">No users found</h3>
          <p className="text-slate-500 font-medium">Get started by creating your first user or adjust your filters.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modern Table with Glass Effect */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200">
              <th 
                onDoubleClick={() => onSort?.('username')}
                className={`px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center gap-2">
                  <span>User</span>
                  {currentSort?.field === 'username' && (
                    <span className="text-blue-600 text-sm">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onDoubleClick={() => onSort?.('email')}
                className={`px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center gap-2">
                  <span>Email</span>
                  {currentSort?.field === 'email' && (
                    <span className="text-blue-600 text-sm">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Roles</th>
              <th 
                onDoubleClick={() => onSort?.('is_active')}
                className={`px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  {currentSort?.field === 'is_active' && (
                    <span className="text-blue-600 text-sm">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onDoubleClick={() => onSort?.('created_at')}
                className={`px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center gap-2">
                  <span>Created</span>
                  {currentSort?.field === 'created_at' && (
                    <span className="text-blue-600 text-sm">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {users.map((user, index) => (
              <tr key={user.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-200 group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(index % 5) + 1}.jpg`} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-xl border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-200"
                      />
                      {user.is_active && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{user.username}</div>
                      <div className="text-xs text-slate-500">@{user.username.toLowerCase().replace(/\s+/g, '')}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-700 font-medium">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2 flex-wrap max-w-xs">
                    {user.roles.slice(0, 2).map((role) => (
                      <span
                        key={role.id}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
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
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 shadow-sm">
                        +{user.roles.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="relative inline-flex items-center cursor-pointer group/toggle">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user.is_active}
                      onChange={() => onToggleStatus(user.id)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-green-600"></div>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-600 font-medium">{formatDate(user.created_at)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit(user)}
                      className="group/btn relative p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-100 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-110"
                      title="Edit user"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDelete(user.id)}
                      className="group/btn relative p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-100 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 hover:scale-110"
                      title="Delete user"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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