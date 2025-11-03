import api from './api'
import { BrokerRight, BrokerRightsResponse, AssignRightResponse, SyncRightsResponse, ApiResponse } from '../types'

export const brokerRightsService = {
  // Get all available broker rights
  async getAllRights(): Promise<BrokerRight[]> {
    const response = await api.get<ApiResponse<BrokerRightsResponse>>('/api/brokers/rights/all')
    return response.data.data.rights
  },

  // Get rights assigned to a specific broker
  async getBrokerRights(brokerId: number): Promise<BrokerRight[]> {
    const response = await api.get<ApiResponse<BrokerRightsResponse>>(`/api/brokers/${brokerId}/rights`)
    return response.data.data.rights
  },

  // Assign a right to a broker
  async assignRightToBroker(brokerId: number, rightId: number): Promise<AssignRightResponse> {
    const response = await api.post<ApiResponse<AssignRightResponse>>(`/api/brokers/${brokerId}/rights`, {
      right_id: rightId
    })
    return response.data.data
  },

  // Revoke a right from a broker
  async revokeRightFromBroker(brokerId: number, rightId: number): Promise<void> {
    await api.delete(`/api/brokers/${brokerId}/rights/${rightId}`)
  },

  // Sync broker rights (bulk update)
  async syncBrokerRights(brokerId: number, rightIds: number[]): Promise<SyncRightsResponse> {
    const response = await api.post<ApiResponse<SyncRightsResponse>>(`/api/brokers/${brokerId}/rights/sync`, {
      right_ids: rightIds
    })
    return response.data.data
  }
}