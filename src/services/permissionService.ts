import api from './api'
import { Permission, ApiResponse } from '../types'

export const permissionService = {
  // Get all permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await api.get<ApiResponse<{ permissions: Permission[]; total: number }>>('/api/permissions')
    return response.data.data.permissions
  },

  // Get permissions for a specific role
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const response = await api.get<ApiResponse<{ permissions: Permission[] }>>(`/api/roles/${roleId}/permissions`)
    return response.data.data.permissions
  },

  // Add permission to role
  async addPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await api.post(`/api/roles/${roleId}/permissions`, { permission_id: permissionId })
  },

  // Remove permission from role
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await api.delete(`/api/roles/${roleId}/permissions/${permissionId}`)
  },

  // Sync permissions for a role (bulk update)
  async syncRolePermissions(roleId: number, permissionIds: number[]): Promise<{ assigned_permissions: number; role_id: number }> {
    const response = await api.post<ApiResponse<{ assigned_permissions: number; role_id: number }>>(`/api/roles/${roleId}/permissions/sync`, {
      permission_ids: permissionIds
    })
    return response.data.data
  }
}