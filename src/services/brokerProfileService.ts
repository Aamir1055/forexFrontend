import api from './api'
import { ApiResponse } from '../types'

export interface BrokerProfile {
  id: number
  name: string
  description: string
  rightsCount: number
  groupsCount: number
  createdAt: string
  updatedAt: string
}

export interface BrokerProfileDetail extends BrokerProfile {
  rights: ProfileRight[]
  groups: ProfileGroup[]
}

export interface ProfileRight {
  id: number
  rightId: number
  name: string
  description: string
}

export interface ProfileGroup {
  id: number
  groupId: number
  mt5_group?: string
  broker_view_group?: string
}

export interface Right {
  id: number
  name: string
  description: string
  category?: string
}

export interface Group {
  id: number
  mt5_group: string
  broker_view_group: string
  description: string
  is_active: boolean
}

export interface CreateBrokerProfileData {
  name: string
  description: string
  groups: number[]
  rights: number[]
}

export interface UpdateBrokerProfileData {
  name?: string
  description?: string
  groups?: number[]
  rights?: number[]
}

export interface BrokerProfilesListResponse {
  profiles: BrokerProfile[]
  total: number
}

export const brokerProfileService = {
  // Get all profiles
  async getAllProfiles(): Promise<BrokerProfilesListResponse> {
    const response = await api.get<ApiResponse<BrokerProfilesListResponse>>('/api/admin/broker-profiles')
    return response.data.data
  },

  // Get profile by ID
  async getProfileById(profileId: number): Promise<BrokerProfileDetail> {
    const response = await api.get<ApiResponse<BrokerProfileDetail>>(`/api/admin/broker-profiles/${profileId}`)
    return response.data.data
  },

  // Create profile
  async createProfile(data: CreateBrokerProfileData): Promise<BrokerProfile> {
    const response = await api.post<ApiResponse<BrokerProfile>>('/api/admin/broker-profiles', data)
    return response.data.data
  },

  // Update profile
  async updateProfile(profileId: number, data: UpdateBrokerProfileData): Promise<BrokerProfile> {
    const response = await api.put<ApiResponse<BrokerProfile>>(`/api/admin/broker-profiles/${profileId}`, data)
    return response.data.data
  },

  // Delete profile
  async deleteProfile(profileId: number): Promise<void> {
    await api.delete(`/api/admin/broker-profiles/${profileId}`)
  },

  // Get all available rights
  async getAllRights(): Promise<Right[]> {
    const response = await api.get<ApiResponse<{ rights: Right[] }>>('/api/brokers/rights/all')
    return response.data.data.rights
  },

  // Get all available groups
  async getAllGroups(): Promise<Group[]> {
    const response = await api.get<ApiResponse<{ groups: Group[] }>>('/api/groups?limit=1000')
    return response.data.data.groups
  }
}

