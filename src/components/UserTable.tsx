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
      <div className="p-12 text-center">
        <UserGroupIcon className="mx-auto h-12 w-12 text-zinc-400" />
        <h3 className="mt-4 text-sm font-semibold">No users found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
              User
            </th>
            <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
              Email
            </th>
            <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
              Role
            </th>
            <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
              Security
            </th>
            <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
              Joined
            </th>
            <th className="h-12 px-6 text-right align-middle font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b transition-colors hover:bg-zinc-50/50">
              <td className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                  </div>
                </div>
              </td>
              <td className="p-6">
                <div className="text-sm">{user.email}</div>
              </td>
              <td className="p-6">
                <div className="flex flex-wrap gap-1">
                  {user.roles && user.roles.length > 0 ? (
                    <>
                      {user.roles.slice(0, 2).map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-zinc-900 text-white"
                        >
                          {role.name}
                        </span>
                      ))}
                      {user.roles.length > 2 && (
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-700">
                          +{user.roles.length - 2}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
                      No Role
                    </span>
                  )}
                </div>
              </td>
              <td className="p-6">
                {user.force_two_factor ? (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700">
                    🔥 Force 2FA
                  </span>
                ) : user.two_factor_enabled ? (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                    🔐 2FA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-zinc-100 text-zinc-600">
                    🔓 None
                  </span>
                )}
              </td>
              <td className="p-6">
                <button
                  onClick={() => onToggleStatus(user.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    user.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-zinc-400'}`} />
                  {user.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="p-6 text-sm text-muted-foreground">
                {formatDate(user.created_at)}
              </td>
              <td className="p-6">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-zinc-100 transition-colors"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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