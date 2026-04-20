import api from './api'
import { Group, CreateGroupData, UpdateGroupData, GroupsResponse, GroupFilters, ApiResponse } from '../types'

export const groupService = {
  // Get all groups with filtering, pagination, and search
  async getGroups(
    page: number = 1, 
    limit: number = 20, 
    filters: GroupFilters = {}
  ): Promise<GroupsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    })

    const response = await api.get<ApiResponse<GroupsResponse>>(`/api/groups?${params}`)
    return response.data.data
  },

  // Get all active groups
  async getActiveGroups(page: number = 1, limit: number = 50): Promise<GroupsResponse> {
    const response = await api.get<ApiResponse<GroupsResponse>>(`/api/groups?is_active=true&page=${page}&limit=${limit}`)
    return response.data.data
  },

  // Search groups
  async searchGroups(searchTerm: string, page: number = 1, limit: number = 20): Promise<GroupsResponse> {
    const response = await api.get<ApiResponse<GroupsResponse>>(`/api/groups?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`)
    return response.data.data
  },

  // Get group by ID
  async getGroupById(id: number): Promise<Group> {
    const response = await api.get<ApiResponse<Group>>(`/api/groups/${id}`)
    return response.data.data
  },

  // Create new group
  async createGroup(groupData: CreateGroupData): Promise<Group> {
    const response = await api.post<ApiResponse<Group>>('/api/groups', groupData)
    return response.data.data
  },

  // Update group
  async updateGroup(id: number, groupData: UpdateGroupData): Promise<Group> {
    const response = await api.put<ApiResponse<Group>>(`/api/groups/${id}`, groupData)
    return response.data.data
  },

  // Toggle group status
  async toggleGroupStatus(id: number): Promise<Group> {
    const response = await api.post<ApiResponse<Group>>(`/api/groups/${id}/toggle-status`)
    return response.data.data
  },

  // Delete group
  async deleteGroup(id: number): Promise<void> {
    await api.delete(`/api/groups/${id}`)
  }
}
