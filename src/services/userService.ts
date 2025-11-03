import api from './api'

export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
  failed_login_attempts: number
  last_failed_login: string | null
  locked_until: string | null
  two_factor_enabled: boolean
  two_factor_secret: string | null
  two_factor_backup_codes: string | null
  two_factor_verified_at: string | null
  force_two_factor: boolean
  roles: Role[]
}

export interface Role {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
  description: string
  category: string
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  is_active: boolean
  role_ids: number[]
  force_two_factor?: boolean
}

export interface UpdateUserData {
  username: string
  email: string
  password?: string
  is_active: boolean
  role_ids?: number[]
  force_two_factor?: boolean
}

export interface PaginationInfo {
  limit: number
  page: number
  pages: number
  total: number
}

export interface UsersResponse {
  data: {
    users: User[]
    pagination: PaginationInfo
  }
  message: string
  status: string
}

export interface UserResponse {
  data: {
    user: User
  }
  message: string
  status: string
}

export const userService = {
  // Get users with pagination
  async getUsers(page: number = 1, limit: number = 20): Promise<UsersResponse> {
    const response = await api.get(`/api/users?page=${page}&limit=${limit}`)
    const d = response?.data
    // Normalize to { data: { users, pagination }, message, status }
    const users = (d?.data?.users ?? d?.users ?? d?.data?.data?.users)
    const pagination = (d?.data?.pagination ?? d?.pagination ?? d?.data?.data?.pagination)
    const normalized: UsersResponse = {
      data: {
        users: Array.isArray(users) ? users : [],
        pagination: pagination || { limit, page, pages: 0, total: 0 },
      },
      message: d?.message ?? '',
      status: d?.status ?? 'success',
    }
    return normalized
  },

  // Get single user
  async getUser(id: number): Promise<UserResponse> {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },

  // Create user
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    console.log('🌐 userService.createUser - Data received from frontend:', userData)
    
    // Transform data for backend
    const backendData: any = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      is_active: userData.is_active,
      force_two_factor: userData.force_two_factor,
    }
    
    // Backend expects "role_ids" array
    if (userData.role_ids && userData.role_ids.length > 0) {
      backendData.role_ids = userData.role_ids
    }
    
    console.log('🌐 userService.createUser - Data being sent to backend:', backendData)
    const response = await api.post('/api/users', backendData)
    console.log('🌐 userService.createUser - Response:', response.data)
    return response.data
  },

  // Update user
  async updateUser(id: number, userData: UpdateUserData): Promise<UserResponse> {
    console.log('🌐 userService.updateUser - ID:', id)
    console.log('🌐 userService.updateUser - Data received from frontend:', userData)
    
    // Transform data for backend
    const backendData: any = {
      username: userData.username,
      email: userData.email,
      is_active: userData.is_active,
      force_two_factor: userData.force_two_factor,
    }
    
    // Add password only if provided
    if (userData.password) {
      backendData.password = userData.password
    }
    
    // Backend expects "role_ids" array
    if (userData.role_ids && userData.role_ids.length > 0) {
      backendData.role_ids = userData.role_ids
    }
    
    console.log('🌐 userService.updateUser - Data being sent to backend:', backendData)
    const response = await api.put(`/api/users/${id}`, backendData)
    console.log('🌐 userService.updateUser - Response:', response.data)
    return response.data
  },

  // Delete user
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/api/users/${id}`)
  },

  // Toggle user status
  async toggleUserStatus(id: number): Promise<UserResponse> {
    const response = await api.post(`/api/users/${id}/toggle-status`)
    return response.data
  },

  // Get roles for user form
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/api/roles')
    const d = response?.data
    const candidates = [
      d?.data?.roles,
      d?.roles,
      d,
    ]
    const roles = candidates.find((c: any) => Array.isArray(c))
    return Array.isArray(roles) ? roles as Role[] : []
  },

  // Get current authenticated user with permissions
  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get('/api/users/me')
    return response.data
  }
}