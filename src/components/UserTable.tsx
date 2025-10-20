import React from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { User, PaginationInfo } from '../services/userService'

interface UserTableProps {
  users: User[]
  isLoading: boolean
  onEdit: (user: User) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Roles</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user, index) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-200">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <img 
                      src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(index % 5) + 1}.jpg`} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full border-2 border-slate-200"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-800">{user.username}</div>
                      <div className="text-xs text-slate-500">@{user.username.toLowerCase().replace(' ', '')}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {user.roles.slice(0, 2).map((role) => (
                      <span
                        key={role.id}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        +{user.roles.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user.is_active}
                      onChange={() => onToggleStatus(user.id)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(user.created_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onEdit(user)}
                      className="text-slate-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(user.id)}
                      className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
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