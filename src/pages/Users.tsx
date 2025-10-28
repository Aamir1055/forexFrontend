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
  const [isDarkMode, setIsDarkMode] = useState(false)
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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20'
    }`}>
      {/* Compact Header with Glass Effect */}
      <div className="px-4 pt-3 pb-2">
        <header className={`backdrop-blur-xl border rounded-xl shadow-lg transition-colors duration-300 ${
          isDarkMode 
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
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
                  }`}>
                    User Management
                  </h1>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {totalItems} {totalItems === 1 ? 'user' : 'users'} • Manage roles and permissions
                  </p>
                </div>
              </div>
              
              {/* Quick Stats and Dark Mode Toggle */}
              <div className="flex items-center gap-3">
                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 focus:ring-purple-500' 
                      : 'bg-slate-300 focus:ring-slate-400'
                  }`}
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
                    isDarkMode ? 'translate-x-7' : 'translate-x-0'
                  }`}>
                    {isDarkMode ? (
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                </button>

                <div className={`text-center px-3 py-1.5 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50' 
                    : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
                }`}>
                  <div className={`text-lg font-bold transition-colors duration-300 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{users.filter(u => u.is_active).length}</div>
                  <div className={`text-[10px] font-medium transition-colors duration-300 ${isDarkMode ? 'text-blue-400/70' : 'text-blue-600/70'}`}>Active</div>
                </div>
                <div className={`text-center px-3 py-1.5 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50' 
                    : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
                }`}>
                  <div className={`text-lg font-bold transition-colors duration-300 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{users.filter(u => !u.is_active).length}</div>
                  <div className={`text-[10px] font-medium transition-colors duration-300 ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}>Inactive</div>
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
                    isDarkMode 
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-blue-500/50 focus:border-blue-400' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/50 focus:border-blue-400'
                  }`}
                />
                <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  isDarkMode ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-500'
                }`} />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
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
                  isDarkMode 
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
                onClick={handleCreateUser}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold text-xs group"
              >
                <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add User</span>
              </button>
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
              <span className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className={`px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-400 text-xs font-medium shadow-sm cursor-pointer transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border-slate-600 text-slate-200 hover:border-slate-500' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value={9999}>All</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>entries</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`text-xs font-medium transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Showing <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{totalItems === 0 ? 0 : startIndex + 1}</span> to <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{Math.min(endIndex, totalItems)}</span> of <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{totalItems}</span> results
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-1.5 border rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${
                      isDarkMode 
                        ? 'border-slate-600 hover:bg-slate-700/50 hover:border-blue-500 disabled:hover:bg-transparent disabled:hover:border-slate-600' 
                        : 'border-slate-200 hover:bg-white hover:border-blue-300 disabled:hover:bg-transparent disabled:hover:border-slate-200'
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className={`px-2 py-1 border rounded-md text-xs font-semibold shadow-sm ${
                    isDarkMode 
                      ? 'bg-slate-700/50 border-slate-600 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 border rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${
                      isDarkMode 
                        ? 'border-slate-600 hover:bg-slate-700/50 hover:border-blue-500 disabled:hover:bg-transparent disabled:hover:border-slate-600' 
                        : 'border-slate-200 hover:bg-white hover:border-blue-300 disabled:hover:bg-transparent disabled:hover:border-slate-200'
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              isDarkMode={isDarkMode}
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