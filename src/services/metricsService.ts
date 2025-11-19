import api from './api'
import type { MetricsResponse } from '../types/metrics'

export const metricsService = {
  async getMetrics(): Promise<MetricsResponse> {
    const response = await api.get<MetricsResponse>('/api/metrics')
    return response.data
  }
}
