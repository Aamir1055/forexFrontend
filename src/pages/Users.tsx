import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  XCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon
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

  // Reset to page 1 when filters change (must be before any conditional returns to keep hooks order stable)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedRole])



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
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                  <p className="text-sm text-gray-500">Manage users and their roles efficiently</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="all">All Roles</option>
                  {rolesList.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create User</span>
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

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
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
          </motion.div>
        </div>
      </main>

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