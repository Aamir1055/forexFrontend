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
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="p-4 space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Users</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {statistics.totalUsers} total users · {statistics.activeUsers} active
            </p>
          </div>
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#5B5FED] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#4B4FDD] transition-colors"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add User
          </button>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid gap-3 grid-cols-4">
          <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{statistics.totalUsers}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {statistics.activeUsers} active
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2">
                <UserGroupIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Active Rate</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{statistics.activePercentage}%</p>
                <p className="text-[10px] text-green-600 mt-0.5 font-medium">
                  {statistics.activeUsers}/{statistics.totalUsers}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">New (30d)</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{statistics.newUsers}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">This month</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2">
                <UserPlusIcon className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">2FA Enabled</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{statistics.twoFAPercentage}%</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {statistics.users2FA} users
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <ShieldCheckIcon className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 p-2.5">
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-7 w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-7 text-xs transition-colors placeholder:text-gray-400 focus:border-[#5B5FED] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5B5FED]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-7 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-medium transition-colors hover:bg-white focus:border-[#5B5FED] focus:outline-none focus:ring-1 focus:ring-[#5B5FED]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-7 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-medium transition-colors hover:bg-white focus:border-[#5B5FED] focus:outline-none focus:ring-1 focus:ring-[#5B5FED]"
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
                className="h-7 px-2.5 rounded-md bg-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
            
            <div className="ml-auto text-[10px] text-gray-500 font-medium">
              {filteredUsers.length} results
            </div>
          </div>
        </div>

        {/* Compact Table */}
        {isLoading ? (
          <div className="rounded-lg bg-white border border-gray-200 p-8 text-center shadow-sm">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#5B5FED]"></div>
            <p className="mt-2 text-xs text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
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