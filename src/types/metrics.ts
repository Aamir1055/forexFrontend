export interface ApiMetric {
  path: string
  total_calls: number
  avg_time_ms: number
  min_time_ms: number
  max_time_ms: number
  total_sent_bytes: number
  total_received_bytes: number
}

export interface MetricsResponse {
  metrics: ApiMetric[]
}
