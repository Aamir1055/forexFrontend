import api from './api'
import { Role, Permission, CreateRoleData, UpdateRoleData, ApiResponse } from '../types'

export const roleService = {
  // Get all roles with permissions
  async getRoles(includePermissions: boolean = true): Promise<Role[]> {
    const response = await api.get<ApiResponse<{ roles: Role[] }>>(`/api/roles?include_permissions=${includePermissions}`)
    return response.data.data.roles
  },

  // Get role by ID
  async getRoleById(id: number): Promise<Role> {
    const response = await api.get<ApiResponse<{ role: Role }>>(`/api/roles/${id}`)
    return response.data.data.role
  },

  // Create new role
  async createRole(roleData: CreateRoleData): Promise<Role> {
    const response = await api.post<ApiResponse<{ role: Role }>>('/api/roles', roleData)
    return response.data.data.role
  },

  // Update role
  async updateRole(id: number, roleData: UpdateRoleData): Promise<Role> {
    const response = await api.put<ApiResponse<{ role: Role }>>(`/api/roles/${id}`, roleData)
    return response.data.data.role
  },

  // Delete role
  async deleteRole(id: number): Promise<void> {
    await api.delete(`/api/roles/${id}`)
  },

  // Get all permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await api.get<ApiResponse<{ permissions: Permission[]; total: number }>>('/api/permissions')
    return response.data.data.permissions
  },

  // Get user roles
  async getUserRoles(userId: number): Promise<Role[]> {
    const response = await api.get<ApiResponse<{ roles: Role[] }>>(`/api/users/${userId}/roles`)
    return response.data.data.roles
  },

  // Assign role to user
  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await api.post(`/api/users/${userId}/roles`, { role_id: roleId })
  },

  // Revoke role from user
  async revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await api.delete(`/api/users/${userId}/roles/${roleId}`)
  },

  // Sync role permissions
  async syncRolePermissions(roleId: number, permissionIds: number[]): Promise<any> {
    const response = await api.put(`/api/roles/${roleId}/permissions`, { permission_ids: permissionIds })
    return response.data
  }
}

