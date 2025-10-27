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
      <div className="p-8 text-center">
        <UserGroupIcon className="mx-auto h-8 w-8 text-gray-300" />
        <h3 className="mt-2 text-xs font-semibold text-gray-900">No users found</h3>
        <p className="mt-1 text-[10px] text-gray-500">
          Try adjusting your search or filters
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">User</span>
            </th>
            <th className="px-3 py-2 text-left">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Email</span>
            </th>
            <th className="px-3 py-2 text-left">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Role</span>
            </th>
            <th className="px-3 py-2 text-left">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Security</span>
            </th>
            <th className="px-3 py-2 text-left">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Status</span>
            </th>
            <th className="px-3 py-2 text-left">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Joined</span>
            </th>
            <th className="px-3 py-2 text-right">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#5B5FED] to-[#7B7FFF] text-[10px] font-semibold text-white flex-shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">{user.username}</div>
                    <div className="text-[10px] text-gray-500">ID: {user.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="text-xs text-gray-700">{user.email}</div>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {user.roles && user.roles.length > 0 ? (
                    <>
                      {user.roles.slice(0, 2).map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center rounded-md bg-[#5B5FED] px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        >
                          {role.name}
                        </span>
                      ))}
                      {user.roles.length > 2 && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                          +{user.roles.length - 2}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                      No Role
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2">
                {user.force_two_factor ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                    🔥 Force
                  </span>
                ) : user.two_factor_enabled ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                    🔐 2FA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    🔓 None
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => onToggleStatus(user.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    user.is_active
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className={`h-1 w-1 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-gray-400'}`} />
                  {user.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-3 py-2 text-xs text-gray-500">
                {formatDate(user.created_at)}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-[#5B5FED] hover:text-[#5B5FED] transition-colors"
                    title="Edit"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Delete"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  )
}

export default UserTable