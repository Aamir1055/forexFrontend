import api from './api'

export interface LogFile {
  filename: string
  modified: number
  size: number
}

export interface LogsListResponse {
  success: boolean
  system_logs: LogFile[]
  mt5_logs: LogFile[]
}

export interface LogContentResponse {
  success: boolean
  filename: string
  lines: string[]
  total_lines: number
  returned_lines: number
  offset?: number
  limit?: number
  search?: string
  regex?: boolean
}

export interface LogParams {
  offset?: number
  limit?: number
  tail?: boolean
  search?: string
  regex?: boolean
}

class LogsService {
  // List all log files
  async listLogs(): Promise<LogsListResponse> {
    const response = await api.get<LogsListResponse>('/api/logs/list')
    return response.data
  }

  // Get system log content
  async getSystemLog(filename: string, params?: LogParams): Promise<LogContentResponse> {
    const response = await api.get<LogContentResponse>(`/api/logs/system/${filename}`, { params })
    return response.data
  }

  // Get MT5 log content
  async getMT5Log(filename: string, params?: LogParams): Promise<LogContentResponse> {
    const response = await api.get<LogContentResponse>(`/api/logs/mt5/${filename}`, { params })
    return response.data
  }
}

export const logsService = new LogsService()

