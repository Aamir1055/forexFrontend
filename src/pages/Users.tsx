import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  XCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { userService, User, CreateUserData, UpdateUserData } from '../services/userService'

import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'
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
  const { data: usersResponse, isLoading, error, refetch } = useQuery(
    ['users', currentPage, itemsPerPage],
    () => {
      // For "All" option or large numbers, fetch a large batch
      const fetchSize = itemsPerPage > 100 ? 1000 : itemsPerPage
      return userService.getUsers(currentPage, fetchSize)
    },
    {
      keepPreviousData: true,
      retry: false,
      onError: (err: any) => {
        // Silently handle 403 errors - we'll show UI message instead
        if (err?.response?.status === 403) {
          console.warn('Access denied to users module')
        } else if (err?.response?.status === 401) {
          toast.error('Session expired. Please log in again.')
        }
      }
    }
  )

  // Fetch roles for the form
  const { data: roles } = useQuery('roles', userService.getRoles, {
    retry: 1,
  })
  const rolesList = Array.isArray(roles) ? roles : []

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

  // Reset to page 1 when filters change (must be before any conditional returns to keep hooks order stable)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedRole, itemsPerPage])

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

  const handleRefresh = async () => {
    await queryClient.invalidateQueries(['users'])
    await refetch()
    toast.success('Users list refreshed!')
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

  // Pagination for sorted users
  // Use client-side pagination only when filters are applied
  const hasFilters = searchTerm.trim() !== '' || selectedRole !== 'all'
  
  let displayUsers = []
  let totalItems = 0
  let totalPages = 1
  let startIndex = 0
  let endIndex = 0

  if (hasFilters) {
    // Client-side pagination when filters are active
    totalItems = sortedUsers.length
    totalPages = Math.ceil(totalItems / itemsPerPage)
    startIndex = (currentPage - 1) * itemsPerPage
    endIndex = startIndex + itemsPerPage
    displayUsers = sortedUsers.slice(startIndex, endIndex)
  } else {
    // Server-side pagination when no filters
    displayUsers = sortedUsers
    totalItems = pagination?.total || sortedUsers.length
    totalPages = pagination?.pages || 1
    startIndex = pagination?.total === 0 ? 0 : ((currentPage - 1) * itemsPerPage)
    endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  }

  // Generate dynamic pagination options based on total items
  const paginationOptions = useMemo(() => {
    const options = []
    const baseOptions = [5, 10, 25, 50, 100]
    
    for (const option of baseOptions) {
      if (option < totalItems) {
        options.push(option)
      }
    }
    
    // Always add "All" option at the end if we have items
    if (totalItems > 0) {
      options.push(totalItems) // Show exact total
    }
    
    // If no options were added (totalItems is very small), add at least one option
    if (options.length === 0 && totalItems > 0) {
      options.push(totalItems)
    }
    
    return options
  }, [totalItems])

  // Handle error states
  if (error) {
    const is403 = (error as any)?.response?.status === 403
    
    if (is403) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full mx-4 p-8 rounded-xl border shadow-xl text-center bg-white border-slate-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-900">
              Access Denied
            </h2>
            <p className="mb-6 text-slate-600">
              You don't have permission to view users. Please contact your administrator for access.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
    
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
    <div className={`min-h-screen transition-colors duration-300 ${
      false 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20'
    }`}>
      {/* Compact Header with Glass Effect */}
      <div className="px-4 pt-3 pb-2">
        <header className={`backdrop-blur-xl border rounded-xl shadow-lg transition-colors duration-300 ${
          false 
            ? 'bg-slate-800/80 border-slate-700/60 shadow-black/20' 
            : 'bg-white/80 border-white/60 shadow-blue-500/5'
        }`}>
          <div className="px-4 py-3">
            {/* Title Section */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                    <UserGroupIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    false 
                      ? 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
                  }`}>
                    User Management
                  </h1>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    false ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {totalItems} {totalItems === 1 ? 'user' : 'users'} • Manage roles and permissions
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-3">
                <div className="text-center px-3 py-1.5 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
                  <div className="text-lg font-bold text-blue-600">{users.filter(u => u.is_active).length}</div>
                  <div className="text-[10px] font-medium text-blue-600/70">Active</div>
                </div>
                <div className="text-center px-3 py-1.5 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
                  <div className="text-lg font-bold text-purple-600">{users.filter(u => !u.is_active).length}</div>
                  <div className="text-[10px] font-medium text-purple-600/70">Inactive</div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  placeholder="Search users by name, email or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-xs shadow-sm ${
                    false 
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-blue-500/50 focus:border-blue-400' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/50 focus:border-blue-400'
                  }`}
                />
                <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  false ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-500'
                }`} />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors ${
                      false ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-xs font-medium shadow-sm cursor-pointer transition-all ${
                  false 
                    ? 'bg-slate-700/50 border-slate-600 text-slate-200 hover:border-slate-500' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value="all">All Roles</option>
                {rolesList.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
              
              <button
                onClick={handleRefresh}
                className="px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-slate-500/30 hover:shadow-xl hover:shadow-slate-500/40 font-semibold text-xs group"
                title="Refresh users list"
              >
                <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                <span>Refresh</span>
              </button>
              
              <PermissionGate module={MODULES.USERS} action="create">
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold text-xs group"
                >
                  <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Add User</span>
                </button>
              </PermissionGate>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="px-4 pb-3">
        <div className="space-y-2">
          {/* Compact Pagination and Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium transition-colors ${false ? 'text-slate-400' : 'text-slate-600'}`}>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className={`px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-400 text-xs font-medium shadow-sm cursor-pointer transition-all ${
                  false 
                    ? 'bg-slate-700/50 border-slate-600 text-slate-200 hover:border-slate-500' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {paginationOptions.map(option => (
                  <option key={option} value={option}>
                    {option === totalItems ? `All (${option})` : option}
                  </option>
                ))}
              </select>
              <span className={`text-xs font-medium transition-colors ${false ? 'text-slate-400' : 'text-slate-600'}`}>entries</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`text-xs font-medium transition-colors ${false ? 'text-slate-400' : 'text-slate-600'}`}>
                Showing <span className={`font-semibold ${false ? 'text-blue-400' : 'text-blue-600'}`}>{totalItems === 0 ? 0 : startIndex + 1}</span> to <span className={`font-semibold ${false ? 'text-blue-400' : 'text-blue-600'}`}>{Math.min(endIndex, totalItems)}</span> of <span className={`font-semibold ${false ? 'text-blue-400' : 'text-blue-600'}`}>{totalItems}</span> results
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-1.5 border rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${
                      false 
                        ? 'border-slate-600 hover:bg-slate-700/50 hover:border-blue-500 disabled:hover:bg-transparent disabled:hover:border-slate-600' 
                        : 'border-slate-200 hover:bg-white hover:border-blue-300 disabled:hover:bg-transparent disabled:hover:border-slate-200'
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${false ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className={`px-2 py-1 border rounded-md text-xs font-semibold shadow-sm ${
                    false 
                      ? 'bg-slate-700/50 border-slate-600 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 border rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${
                      false 
                        ? 'border-slate-600 hover:bg-slate-700/50 hover:border-blue-500 disabled:hover:bg-transparent disabled:hover:border-slate-600' 
                        : 'border-slate-200 hover:bg-white hover:border-blue-300 disabled:hover:bg-transparent disabled:hover:border-slate-200'
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${false ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <UserTable
              users={displayUsers}
              isLoading={isLoading}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
              onSort={handleSort}
              currentSort={{ field: sortField, order: sortOrder }}
              pagination={undefined}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              false={false}
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
          false={false}
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

