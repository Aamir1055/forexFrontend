import api from './api'
import { ApiResponse } from '../types'

export interface BrokerGroupMapping {
  id: number
  group_id: number
  created_at: string
}

export interface GroupMappingsResponse {
  group_mappings: BrokerGroupMapping[]
}

export interface SyncGroupsRequest {
  group_ids: number[]
}

export const brokerGroupMappingService = {
  // Get broker's group mappings
  async getBrokerGroupMappings(brokerId: number): Promise<BrokerGroupMapping[]> {
    const response = await api.get<ApiResponse<GroupMappingsResponse>>(`/api/brokers/${brokerId}/group-mappings`)
    return response.data.data.group_mappings
  },

  // Assign a group to broker
  async assignGroup(brokerId: number, groupId: number): Promise<BrokerGroupMapping> {
    const response = await api.post<ApiResponse<BrokerGroupMapping>>(
      `/api/brokers/${brokerId}/group-mappings`,
      { group_id: groupId }
    )
    return response.data.data
  },

  // Remove group from broker
  async removeGroup(brokerId: number, mappingId: number): Promise<void> {
    await api.delete(`/api/brokers/${brokerId}/group-mappings/${mappingId}`)
  },

  // Sync all groups for a broker (replace existing with new set)
  async syncBrokerGroups(brokerId: number, groupIds: number[]): Promise<void> {
    // First, get existing mappings
    const existing = await this.getBrokerGroupMappings(brokerId)
    
    // Delete all existing mappings
    for (const mapping of existing) {
      await this.removeGroup(brokerId, mapping.id)
    }
    
    // Add new mappings
    for (const groupId of groupIds) {
      await this.assignGroup(brokerId, groupId)
    }
  }
}
