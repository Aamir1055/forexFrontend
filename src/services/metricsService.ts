import api from './api'
import type { MetricsResponse } from '../types/metrics'
import type { ApiResponse } from '../types'

export const metricsService = {
  async getMetrics(): Promise<MetricsResponse> {
    const response = await api.get<ApiResponse<MetricsResponse>>('/api/metrics')
    // Backend wraps response in { status, data: { metrics: [] } }
    const payload = response.data?.data ?? response.data
    return { metrics: Array.isArray(payload?.metrics) ? payload.metrics : [] }
  }
}
