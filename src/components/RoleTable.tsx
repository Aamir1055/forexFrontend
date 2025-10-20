import React from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/solid'
import { Role } from '../types'

interface RoleTableProps {
  roles: Role[]
  isLoading: boolean
  onEdit: (role: Role) => void
  onDelete: (id: number) => void
}

const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  isLoading,
  onEdit,
  onDelete
}) => {
  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase()
    if (name.includes('admin')) {
      return (
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm2.7-2h8.6l.9-4.4L14 12l-2-3.4L10 12l-3.2-2.4L7.7 14z"/>
          </svg>
        </div>
      )
    } else if (name.includes('moderator')) {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
        </div>
      )
    } else if (name.includes('analyst')) {
      return (
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <ChartBarIcon className="w-4 h-4 text-green-600" />
        </div>
      )
    } else {
      return (
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <UserGroupIcon className="w-4 h-4 text-purple-600" />
        </div>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-6"></div>
          <p className="text-slate-600 font-medium">Loading roles...</p>
        </div>
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserGroupIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No roles found</h3>
          <p className="text-slate-600 font-medium">Get started by creating your first role.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(role.name)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{role.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">{role.description || 'No description provided'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {role.permissions?.length || 0} permissions
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => onEdit(role)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Edit role"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Edit
                      </div>
                    </button>
                    <button 
                      onClick={() => onDelete(role.id)}
                      className="group relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      title="Delete role"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Delete
                      </div>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing 1 to {roles.length} of {roles.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50" disabled>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">2</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">3</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleTable