import api from './api'
import { Broker, CreateBrokerData, UpdateBrokerData, BrokersResponse, BrokerFilters, ApiResponse } from '../types'

export const brokerService = {
  // Get all brokers with filtering, pagination, and sorting
  async getBrokers(
    page: number = 1, 
    limit: number = 20, 
    filters: BrokerFilters = {}
  ): Promise<BrokersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    })

    const response = await api.get<ApiResponse<BrokersResponse>>(`/api/brokers?${params}`)
    return response.data.data
  },

  // Get broker by ID
  async getBrokerById(id: number): Promise<Broker> {
    const response = await api.get<ApiResponse<{ broker: Broker }>>(`/api/brokers/${id}`)
    return response.data.data.broker
  },

  // Create new broker
  async createBroker(brokerData: CreateBrokerData): Promise<Broker> {
    const response = await api.post<ApiResponse<{ broker: Broker }>>('/api/brokers', brokerData)
    return response.data.data.broker
  },

  // Update broker
  async updateBroker(id: number, brokerData: UpdateBrokerData): Promise<Broker> {
    const response = await api.put<ApiResponse<{ broker: Broker }>>(`/api/brokers/${id}`, brokerData)
    return response.data.data.broker
  },

  // Delete broker
  async deleteBroker(id: number): Promise<void> {
    await api.delete(`/api/brokers/${id}`)
  },

  // Toggle broker status
  async toggleBrokerStatus(id: number): Promise<Broker> {
    // Get current broker status first
    const currentBroker = await this.getBrokerById(id)
    
    // Update broker status using the correct plural endpoint
    const response = await api.put<ApiResponse<{ broker: Broker }>>(`/api/brokers/${id}`, {
      is_active: !currentBroker.is_active
    })
    return response.data.data.broker
  },

  // Update match all condition
  async updateMatchAllCondition(id: number, matchAllCondition: boolean): Promise<Broker> {
    const response = await api.put<ApiResponse<{ broker: Broker }>>(`/api/brokers/${id}`, {
      match_all_condition: matchAllCondition
    })
    return response.data.data.broker
  }
}
