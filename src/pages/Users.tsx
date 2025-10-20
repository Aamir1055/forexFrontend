import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  UserIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { userService, User, CreateUserData, UpdateUserData } from '../services/userService'
import UserTable from '../components/UserTable'
import UserModal from '../components/UserModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'

const Users: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    userId: number | null
    username: string
  }>({
    isOpen: false,
    userId: null,
    username: ''
  })
  const queryClient = useQueryClient()

  // Fetch users
  const { data: usersResponse, isLoading, error } = useQuery(
    ['users', currentPage],
    () => userService.getUsers(currentPage, 20),
    {
      keepPreviousData: true,
      retry: 1,
    }
  )

  // Fetch roles for the form
  const { data: roles } = useQuery('roles', userService.getRoles, {
    retry: 1,
  })

  // Extract users and pagination from response
  const users = usersResponse?.data?.users || []
  const pagination = usersResponse?.data?.pagination

  // Filter users based on search term and role
  const filteredUsers = useMemo(() => {
    let filtered = users
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.roles.some(role => role.name.toLowerCase().includes(term))
      )
    }
    
    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => 
        user.roles.some(role => role.name === selectedRole)
      )
    }
    
    return filtered
  }, [users, searchTerm, selectedRole])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = pagination?.total || users.length
    const activeUsers = users.filter(u => u.is_active).length
    const inactiveUsers = users.filter(u => !u.is_active).length
    const newThisMonth = users.filter(u => {
      const created = new Date(u.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length

    return { totalUsers, activeUsers, inactiveUsers, newThisMonth }
  }, [users, pagination])

  // Create user mutation
  const createUserMutation = useMutation(
    (userData: CreateUserData) => userService.createUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        setIsModalOpen(false)
        toast.success('User created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create user')
      }
    }
  )

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ id, userData }: { id: number; userData: UpdateUserData }) =>
      userService.updateUser(id, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        setIsModalOpen(false)
        setEditingUser(null)
        toast.success('User updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user')
      }
    }
  )

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (id: number) => userService.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('User deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete user')
      }
    }
  )

  // Toggle user status mutation
  const toggleStatusMutation = useMutation(
    (id: number) => userService.toggleUserStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('User status updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user status')
      }
    }
  )

  const handleCreateUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDeleteUser = (id: number) => {
    const user = usersResponse?.users?.find((u: User) => u.id === id)
    setDeleteConfirmation({
      isOpen: true,
      userId: id,
      username: user?.username || 'Unknown User'
    })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.userId) {
      deleteUserMutation.mutate(deleteConfirmation.userId)
      setDeleteConfirmation({ isOpen: false, userId: null, username: '' })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, userId: null, username: '' })
  }

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id)
  }

  const handleSubmit = (data: CreateUserData | UpdateUserData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data as UpdateUserData })
    } else {
      createUserMutation.mutate(data as CreateUserData)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-200">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h3>
          <p className="text-gray-600">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="text-blue-600 w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-slate-500">Total Users</p>
                  <p className="text-xl font-bold text-slate-800">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="text-green-600 w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-slate-500">Active Users</p>
                  <p className="text-xl font-bold text-slate-800">{stats.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <XCircleIcon className="text-orange-600 w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-slate-500">Inactive Users</p>
                  <p className="text-xl font-bold text-slate-800">{stats.inactiveUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserIcon className="text-purple-600 w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-slate-500">New This Month</p>
                  <p className="text-xl font-bold text-slate-800">{stats.newThisMonth}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {/* Table Header */}
            <div className="px-4 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  </div>
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="all">All Roles</option>
                    {roles?.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleCreateUser}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <PlusIcon className="w-4 h-4 mr-2 inline" />
                  Create User
                </button>
              </div>
            </div>

            <UserTable
              users={filteredUsers}
              isLoading={isLoading}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
              pagination={searchTerm || selectedRole !== 'all' ? undefined : pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <UserModal
          user={editingUser}
          roles={roles || []}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingUser(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createUserMutation.isLoading || updateUserMutation.isLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete the user "${deleteConfirmation.username}"? This action cannot be undone and will permanently remove all user data and associated records.`}
        confirmText="Delete User"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteUserMutation.isLoading}
      />
    </div>
  )
}

export default Users