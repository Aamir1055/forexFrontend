import api from './api'
import { AuditLog, AuditLogsResponse, AuditLogFilters, ExportAuditLogsParams } from '../types'

export const auditLogService = {
  // Get all audit logs with filters
  getAuditLogs: async (filters: AuditLogFilters = {}): Promise<AuditLogsResponse> => {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.action) params.append('action', filters.action)
    if (filters.user_id) params.append('user_id', filters.user_id.toString())
    if (filters.table_name) params.append('table_name', filters.table_name)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)
    if (filters.search) params.append('search', filters.search)
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.order) params.append('order', filters.order)

    const response = await api.get(`/api/audit-logs?${params.toString()}`)
    return response.data
  },

  // Get single audit log by ID
  getAuditLogById: async (id: number): Promise<{ success: boolean; log: AuditLog }> => {
    const response = await api.get(`/api/audit-logs/${id}`)
    return response.data
  },

  // Get audit logs by user ID
  getAuditLogsByUser: async (userId: number, page: number = 1, limit: number = 20): Promise<AuditLogsResponse> => {
    const response = await api.get(`/api/audit-logs/user/${userId}?page=${page}&limit=${limit}`)
    return {
      success: response.data.success,
      logs: response.data.logs,
      pagination: response.data.pagination || {
        current_page: page,
        per_page: limit,
        total_items: response.data.logs.length,
        total_pages: 1
      }
    }
  },

  // Get audit logs by action
  getAuditLogsByAction: async (action: string, page: number = 1, limit: number = 20): Promise<AuditLogsResponse> => {
    const response = await api.get(`/api/audit-logs/action/${action}?page=${page}&limit=${limit}`)
    return {
      success: response.data.success,
      logs: response.data.logs,
      pagination: response.data.pagination || {
        current_page: page,
        per_page: limit,
        total_items: response.data.logs.length,
        total_pages: 1
      }
    }
  },

  // Get audit logs by table
  getAuditLogsByTable: async (tableName: string, page: number = 1, limit: number = 20): Promise<AuditLogsResponse> => {
    const response = await api.get(`/api/audit-logs/table/${tableName}?page=${page}&limit=${limit}`)
    return {
      success: response.data.success,
      logs: response.data.logs,
      pagination: response.data.pagination || {
        current_page: page,
        per_page: limit,
        total_items: response.data.logs.length,
        total_pages: 1
      }
    }
  },

  // Export audit logs
  exportAuditLogs: async (params: ExportAuditLogsParams): Promise<Blob> => {
    const queryParams = new URLSearchParams()
    queryParams.append('format', params.format)
    
    if (params.action) queryParams.append('action', params.action)
    if (params.user_id) queryParams.append('user_id', params.user_id.toString())
    if (params.table_name) queryParams.append('table_name', params.table_name)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    if (params.search) queryParams.append('search', params.search)

    const response = await api.get(`/api/audit-logs/export?${queryParams.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  }
}
