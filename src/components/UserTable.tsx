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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-slate-600 font-medium">Loading users...</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserGroupIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No users found</h3>
          <p className="text-slate-600 font-medium">Get started by creating your first user.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Table Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th 
                onDoubleClick={() => onSort?.('username')}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center space-x-1">
                  <span>User</span>
                  {currentSort?.field === 'username' && (
                    <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onDoubleClick={() => onSort?.('email')}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  {currentSort?.field === 'email' && (
                    <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Roles</th>
              <th 
                onDoubleClick={() => onSort?.('is_active')}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {currentSort?.field === 'is_active' && (
                    <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onDoubleClick={() => onSort?.('created_at')}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                title={onSort ? 'Double-click to sort' : ''}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {currentSort?.field === 'created_at' && (
                    <span className="text-blue-600">{currentSort.order === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user, index) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-200">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(index % 5) + 1}.jpg`} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-800">{user.username}</div>
                      <div className="text-xs text-slate-500">@{user.username.toLowerCase().replace(' ', '')}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex space-x-1">
                    {user.roles.slice(0, 2).map((role) => (
                      <span
                        key={role.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          role.name.toLowerCase() === 'admin' 
                            ? 'bg-blue-100 text-blue-700'
                            : role.name.toLowerCase() === 'editor'
                            ? 'bg-green-100 text-green-700'
                            : role.name.toLowerCase() === 'viewer'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {role.name}
                      </span>
                    ))}
                    {user.roles.length > 2 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        +{user.roles.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user.is_active}
                      onChange={() => onToggleStatus(user.id)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button 
                      onClick={() => onEdit(user)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Edit user"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDelete(user.id)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Delete user"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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