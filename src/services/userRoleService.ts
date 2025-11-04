import api from './api'
import { Role, ApiResponse } from '../types'

export interface UserRole {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface AssignRoleRequest {
  role_id: number
}

export const userRoleService = {
  // Get roles assigned to a user
  async getUserRoles(userId: number): Promise<UserRole[]> {
    const response = await api.get<ApiResponse<{ roles: UserRole[] }>>(`/api/users/${userId}/roles`)
    return response.data.data.roles
  },

  // Assign a role to a user
  async assignRole(userId: number, roleId: number): Promise<void> {
    await api.post(`/api/users/${userId}/roles`, { role_id: roleId })
  },

  // Revoke a role from a user
  async revokeRole(userId: number, roleId: number): Promise<void> {
    await api.delete(`/api/users/${userId}/roles/${roleId}`)
  },

  // Get all available roles with permissions
  async getAllRoles(): Promise<Role[]> {
    const response = await api.get<ApiResponse<{ roles: Role[] }>>('/api/roles?include_permissions=true')
    return response.data.data.roles
  }
}
