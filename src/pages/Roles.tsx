import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ShieldCheckIcon } from '@heroicons/react/24/solid'
import { roleService } from '../services/roleService'
import RoleTable from '../components/RoleTable'
import RoleModal from '../components/RoleModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { Role, CreateRoleData, UpdateRoleData } from '../types'
import toast from 'react-hot-toast'

const Roles: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    roleId: number | null
    roleName: string
  }>({
    isOpen: false,
    roleId: null,
    roleName: ''
  })
  const queryClient = useQueryClient()

  // Fetch roles
  const { data: roles, isLoading, error } = useQuery(
    'roles',
    () => roleService.getRoles(true)
  )

  // Fetch permissions for the form
  const { data: permissions } = useQuery('permissions', roleService.getPermissions)

  // Create role mutation
  const createRoleMutation = useMutation(
    (roleData: CreateRoleData) => roleService.createRole(roleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['roles'])
        setIsModalOpen(false)
        toast.success('Role created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create role')
      }
    }
  )

  // Update role mutation
  const updateRoleMutation = useMutation(
    ({ id, roleData }: { id: number; roleData: UpdateRoleData }) =>
      roleService.updateRole(id, roleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['roles'])
        setIsModalOpen(false)
        setEditingRole(null)
        toast.success('Role updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update role')
      }
    }
  )

  // Delete role mutation
  const deleteRoleMutation = useMutation(
    (id: number) => roleService.deleteRole(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['roles'])
        toast.success('Role deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete role')
      }
    }
  )

  const handleCreateRole = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleDeleteRole = (id: number) => {
    const role = roles?.find(r => r.id === id)
    setDeleteConfirmation({
      isOpen: true,
      roleId: id,
      roleName: role?.name || 'Unknown Role'
    })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.roleId) {
      deleteRoleMutation.mutate(deleteConfirmation.roleId)
      setDeleteConfirmation({ isOpen: false, roleId: null, roleName: '' })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, roleId: null, roleName: '' })
  }

  const handleSubmit = (data: CreateRoleData | UpdateRoleData) => {
    console.log('Submitting role data:', data)
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, roleData: data as UpdateRoleData })
    } else {
      createRoleMutation.mutate(data as CreateRoleData)
    }
  }

  const filteredRoles = roles?.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Pagination calculations
  const totalItems = filteredRoles.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading roles. Please check your API connection.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Role Management</h1>
                <p className="text-sm text-gray-500">Manage roles and permissions efficiently</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create Role</span>
              </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-6">
        <div>
          {/* Pagination dropdown */}
          <div className="mt-4 mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-gray-600">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-xs"
              >
                <option value={9999}>All</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs text-gray-600">entries</span>
            </div>
            <div className="text-xs text-gray-700">
              Showing {totalItems === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Roles Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RoleTable
              roles={paginatedRoles}
              isLoading={isLoading}
              onEdit={handleEditRole}
              onDelete={handleDeleteRole}
            />
          </motion.div>
        </div>
      </main>

      {/* Role Modal */}
      {isModalOpen && (
        <RoleModal
          role={editingRole}
          permissions={permissions || []}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingRole(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createRoleMutation.isLoading || updateRoleMutation.isLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deleteConfirmation.roleName}"? This action cannot be undone and will remove all associated permissions and user assignments.`}
        confirmText="Delete Role"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteRoleMutation.isLoading}
      />
    </div>
  )
}

export default Roles