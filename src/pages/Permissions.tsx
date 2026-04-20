import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { permissionService } from '../services/permissionService'
import { roleService } from '../services/roleService'
import PermissionTable from '../components/PermissionTable'
import PermissionRoleModal from '../components/PermissionRoleModal'
import { Permission } from '../types'

const Permissions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  // Fetch permissions
  const { data: permissions, isLoading, error } = useQuery(
    'permissions',
    permissionService.getPermissions
  )

  // Fetch roles for role assignment
  const { data: roles } = useQuery('roles', () => roleService.getRoles(false))

  const handleManageRoles = (permission: Permission) => {
    setSelectedPermission(permission)
    setIsRoleModalOpen(true)
  }

  // Get unique categories
  const categories = [...new Set(permissions?.map(p => p.category) || [])].sort()

  // Filter permissions based on search and category
  const filteredPermissions = permissions?.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory
    return matchesSearch && matchesCategory
  }) || []

  // Group permissions by category
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const category = permission.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading permissions. Please check your API connection.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system permissions and their role assignments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {permissions?.length || 0}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Permissions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {permissions?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {categories.length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Categories
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {categories.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {roles?.length || 0}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Roles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {roles?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {filteredPermissions.length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Filtered Results
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredPermissions.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category?.charAt(0)?.toUpperCase() + category?.slice(1)?.replace('_', ' ') || category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <PermissionTable
        groupedPermissions={groupedPermissions}
        isLoading={isLoading}
        onManageRoles={handleManageRoles}
      />

      {/* Permission Role Modal */}
      {isRoleModalOpen && selectedPermission && (
        <PermissionRoleModal
          permission={selectedPermission}
          roles={roles || []}
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false)
            setSelectedPermission(null)
          }}
        />
      )}
    </div>
  )
}

export default Permissions

