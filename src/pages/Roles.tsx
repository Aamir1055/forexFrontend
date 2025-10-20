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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <img 
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" 
                  alt="User" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto">


          {/* Action Bar */}
          <div className="flex items-center justify-end mb-6">
            <button
              onClick={handleCreateRole}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Role</span>
            </button>
          </div>

          {/* Roles Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RoleTable
              roles={filteredRoles}
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