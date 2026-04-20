import api from './api'
import { AccountMapping, CreateAccountMappingData, ApiResponse } from '../types'

export const accountMappingService = {
  // Get account mappings for a broker
  async getBrokerAccountMappings(brokerId: number): Promise<AccountMapping[]> {
    const response = await api.get<ApiResponse<{ account_mappings: AccountMapping[] }>>(`/api/brokers/${brokerId}/account-mappings`)
    return response.data.data.account_mappings
  },

  // Create account mapping for a broker
  async createAccountMapping(brokerId: number, mappingData: CreateAccountMappingData): Promise<AccountMapping> {
    const response = await api.post<ApiResponse<{ account_mapping: AccountMapping }>>(`/api/brokers/${brokerId}/account-mappings`, mappingData)
    return response.data.data.account_mapping
  },

  // Delete account mapping
  async deleteAccountMapping(brokerId: number, mappingId: number): Promise<void> {
    await api.delete(`/api/brokers/${brokerId}/account-mappings/${mappingId}`)
  }
}
