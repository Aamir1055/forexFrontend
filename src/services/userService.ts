import axios from 'axios'

const API_BASE_URL = '/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
  category: string
  description: string
  permission: string
  permission_id: number
  rp_id: number
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  is_active: boolean
  role_ids: number[]
}

export interface UpdateUserData {
  username: string
  email: string
  password?: string
  is_active: boolean
  role_ids?: number[]
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
    const response = await api.get(`/users?page=${page}&limit=${limit}`)
    return response.data
  },

  // Get single user
  async getUser(id: number): Promise<UserResponse> {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Create user
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    const response = await api.post('/users', userData)
    return response.data
  },

  // Update user
  async updateUser(id: number, userData: UpdateUserData): Promise<UserResponse> {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  // Toggle user status
  async toggleUserStatus(id: number): Promise<UserResponse> {
    const response = await api.post(`/users/${id}/toggle-status`)
    return response.data
  },

  // Get roles for user form
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/roles')
    return response.data.data?.roles || response.data
  }
}