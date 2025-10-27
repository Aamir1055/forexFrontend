import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  XCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
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
  const [selectedStatus, setSelectedStatus] = useState('all') // New: status filter
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
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
  const rolesList = Array.isArray(roles) ? roles : []

  // Extract users and pagination from response
  const users = usersResponse?.data?.users || []
  // const pagination = usersResponse?.data?.pagination

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.is_active).length
    const inactiveUsers = totalUsers - activeUsers
    const users2FA = users.filter(u => u.two_factor_enabled).length
    const usersForced2FA = users.filter(u => u.force_two_factor).length
    
    // Calculate new users (created in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newUsers = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length
    
    // Calculate percentage
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    const twoFAPercentage = totalUsers > 0 ? Math.round((users2FA / totalUsers) * 100) : 0
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      activePercentage,
      newUsers,
      users2FA,
      usersForced2FA,
      twoFAPercentage
    }
  }, [users])

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
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => 
        selectedStatus === 'active' ? user.is_active : !user.is_active
      )
    }
    
    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => 
        user.roles.some(role => role.name === selectedRole)
      )
    }
    
    return filtered
  }, [users, searchTerm, selectedRole, selectedStatus])

  // Reset to page 1 when filters change (must be before any conditional returns to keep hooks order stable)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedRole, selectedStatus])



  // Create user mutation
  const createUserMutation = useMutation(
    (userData: CreateUserData) => {
      console.log('🆕 Users.tsx - createUserMutation called with:', userData)
      return userService.createUser(userData)
    },
    {
      onSuccess: (data) => {
        console.log('✅ Users.tsx - Create successful, response:', data)
        queryClient.invalidateQueries(['users'])
        setIsModalOpen(false)
        toast.success('User created successfully!')
      },
      onError: (error: any) => {
        console.error('❌ Users.tsx - Create failed:', error)
        toast.error(error.response?.data?.message || 'Failed to create user')
      }
    }
  )

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ id, userData }: { id: number; userData: UpdateUserData }) => {
      console.log('🚀 Users.tsx - updateUserMutation called with:', { id, userData })
      return userService.updateUser(id, userData)
    },
    {
      onSuccess: (data) => {
        console.log('✅ Users.tsx - Update successful, response:', data)
        queryClient.invalidateQueries(['users'])
        setIsModalOpen(false)
        setEditingUser(null)
        toast.success('User updated successfully!')
      },
      onError: (error: any) => {
        console.error('❌ Users.tsx - Update failed:', error)
        console.error('❌ Error response:', error.response)
        console.error('❌ Error message:', error.message)
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
    const user = usersResponse?.data?.users?.find((u: User) => u.id === id)
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
    console.log('📤 Users.tsx - handleSubmit called')
    console.log('📤 Data received:', data)
    console.log('📤 Editing user:', editingUser)
    
    if (editingUser) {
      console.log('📤 Calling updateUserMutation with:', { id: editingUser.id, userData: data })
      updateUserMutation.mutate({ id: editingUser.id, userData: data as UpdateUserData })
    } else {
      console.log('📤 Calling createUserMutation with:', data)
      createUserMutation.mutate(data as CreateUserData)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortField(field)
      setSortOrder('ASC')
    }
  }

  // Sort filtered users
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue: any = a[sortField as keyof User]
      let bValue: any = b[sortField as keyof User]

      // Handle boolean for is_active
      if (sortField === 'is_active') {
        aValue = aValue ? 1 : 0
        bValue = bValue ? 1 : 0
      }

      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1
      return 0
    })
  }, [filteredUsers, sortField, sortOrder])

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

  // Pagination for sorted users
  const totalItems = sortedUsers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex)

  

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-zinc-500 mt-1">
              Manage your team members and their account permissions
            </p>
          </div>
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add User
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-500">Total Users</p>
                <p className="text-2xl font-bold">{statistics.totalUsers}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {statistics.activeUsers} active, {statistics.inactiveUsers} inactive
                </p>
              </div>
              <div className="rounded-full bg-zinc-100 p-3">
                <UserGroupIcon className="h-5 w-5 text-zinc-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-500">Active Rate</p>
                <p className="text-2xl font-bold">{statistics.activePercentage}%</p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  {statistics.activeUsers} of {statistics.totalUsers} users
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-500">New This Month</p>
                <p className="text-2xl font-bold">{statistics.newUsers}</p>
                <p className="text-xs text-zinc-500 mt-1">Last 30 days</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <UserPlusIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-500">2FA Enabled</p>
                <p className="text-2xl font-bold">{statistics.twoFAPercentage}%</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {statistics.users2FA} users · {statistics.usersForced2FA} forced
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <ShieldCheckIcon className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-300 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm opacity-70 hover:opacity-100"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-9 rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex h-9 rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900"
              >
                <option value="all">All Roles</option>
                {rolesList.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>

              {(searchTerm || selectedStatus !== 'all' || selectedRole !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedStatus('all')
                    setSelectedRole('all')
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium hover:bg-zinc-200 transition-colors h-9"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900"></div>
            <p className="mt-4 text-sm text-zinc-500">Loading users...</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-white shadow-sm">
            <UserTable
              users={paginatedUsers}
              isLoading={isLoading}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
              onSort={handleSort}
              currentSort={{ field: sortField, order: sortOrder }}
              pagination={undefined}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
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