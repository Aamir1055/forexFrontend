import React, { useState, useMemo } from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/solid'
import { Role } from '../types'
import { PermissionGate } from './PermissionGate'
import { MODULES } from '../utils/permissions'

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
    const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortField(field)
      setSortOrder('ASC')
    }
  }

  const sortedRoles = useMemo(() => {
    if (!sortField) return roles

    return [...roles].sort((a, b) => {
      let aValue: any = a[sortField as keyof Role]
      let bValue: any = b[sortField as keyof Role]

      // Special handling for permissions count
      if (sortField === 'permissions') {
        aValue = a.permissions?.length || 0
        bValue = b.permissions?.length || 0
      }

      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1
      return 0
    })
  }, [roles, sortField, sortOrder])
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
        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
          <ChartBarIcon className="w-4 h-4 text-yellow-600" />
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
      <div className={`rounded-xl shadow-sm overflow-hidden ${
        'bg-white'
      }`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-6"></div>
          <p className="font-medium text-slate-600">Loading roles...</p>
        </div>
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className={`rounded-xl shadow-sm overflow-hidden ${
        'bg-white'
      }`}>
        <div className="p-16 text-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            'bg-slate-100'
          }`}>
            <UserGroupIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-900">No roles found</h3>
          <p className="font-medium text-slate-600">Get started by creating your first role.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden backdrop-blur-xl ${
      false 
        ? 'bg-slate-800/80 border-slate-700/60' 
        : 'bg-white/80 border-white/60'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`border-b ${
            false 
              ? 'bg-slate-700/50 border-slate-600' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <tr>
              <th 
                onClick={() => handleSort('name')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  false 
                    ? 'text-slate-300 hover:bg-slate-600/50' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>Role</span>
                  {sortField === 'name' && (
                    <span className="text-blue-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('description')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  false 
                    ? 'text-slate-300 hover:bg-slate-600/50' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>Description</span>
                  {sortField === 'description' && (
                    <span className="text-blue-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('permissions')}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  false 
                    ? 'text-slate-300 hover:bg-slate-600/50' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>Permissions</span>
                  {sortField === 'permissions' && (
                    <span className="text-blue-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                'text-gray-500'
              }`}>Status</th>
              <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                'text-gray-500'
              }`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedRoles.map((role) => (
              <tr key={role.id} className={`transition-colors duration-150 ${
                false ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
              }`}>
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
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <PermissionGate module={MODULES.ROLES} action="edit">
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
                    </PermissionGate>
                    <PermissionGate module={MODULES.ROLES} action="delete">
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
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RoleTable

