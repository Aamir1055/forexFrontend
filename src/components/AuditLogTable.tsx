import React from 'react'
import { motion } from 'framer-motion'
import { AuditLog } from '../types'
import Badge from './ui/Badge'
import { format } from 'date-fns'
import { useDarkMode } from '../contexts/DarkModeContext'

interface AuditLogTableProps {
  logs: AuditLog[]
  isLoading?: boolean
  onSort?: (field: string) => void
  currentSort?: { field: string; order: 'asc' | 'desc' }
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, isLoading, onSort, currentSort }) => {
  const { isDarkMode } = useDarkMode()
  const getActionBadgeColor = (action: string): 'success' | 'warning' | 'danger' | 'info' => {
    if (action.includes('CREATE')) return 'success'
    if (action.includes('UPDATE')) return 'info'
    if (action.includes('DELETE')) return 'danger'
    if (action.includes('LOGIN')) return 'success'
    if (action.includes('LOGOUT')) return 'warning'
    return 'info'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss')
    } catch {
      return dateString
    }
  }

  const formatValues = (values?: Record<string, any>) => {
    if (!values) return 'N/A'
    return Object.entries(values)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')
  }

  if (isLoading) {
    return (
      <div className={`backdrop-blur-xl rounded-xl border shadow-lg p-8 transition-colors ${
        isDarkMode 
          ? 'bg-slate-800/80 border-slate-700/60' 
          : 'bg-white/80 border-white/60'
      }`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className={`backdrop-blur-xl rounded-xl border shadow-lg p-12 text-center transition-colors ${
        isDarkMode 
          ? 'bg-slate-800/80 border-slate-700/60' 
          : 'bg-white/80 border-white/60'
      }`}>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>No audit logs found</p>
      </div>
    )
  }

  return (
    <div className={`backdrop-blur-xl rounded-xl border shadow-lg overflow-hidden transition-colors ${
      isDarkMode 
        ? 'bg-slate-800/80 border-slate-700/60' 
        : 'bg-white/80 border-white/60'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`border-b transition-colors ${
            isDarkMode 
              ? 'bg-slate-700/50 border-slate-600' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <tr>
              <th 
                onClick={() => onSort?.('id')}
                className={`px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wide cursor-pointer transition-colors ${
                  isDarkMode 
                    ? 'text-slate-300 hover:bg-slate-600/50' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  {currentSort?.field === 'id' && (
                    <span className="text-blue-600">{currentSort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('username')}
                className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors"
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>User</span>
                  {currentSort?.field === 'username' && (
                    <span className="text-blue-600">{currentSort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('action')}
                className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors"
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>Action</span>
                  {currentSort?.field === 'action' && (
                    <span className="text-blue-600">{currentSort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('table_name')}
                className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors"
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>Table</span>
                  {currentSort?.field === 'table_name' && (
                    <span className="text-blue-600">{currentSort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('record_id')}
                className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors"
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>Record ID</span>
                  {currentSort?.field === 'record_id' && (
                    <span className="text-blue-600">{currentSort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('ip_address')}
                className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors"
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>IP Address</span>
                  {currentSort?.field === 'ip_address' && (
                    <span className="text-blue-600">{currentSort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                onClick={() => onSort?.('created_at')}
                className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors"
                title="Click to sort"
              >
                <div className="flex items-center space-x-1">
                  <span>Timestamp</span>
                  {currentSort?.field === 'created_at' && (
                    <span className="text-blue-600">{currentSort.order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                Changes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log, index) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-2 py-2">
                  <p className="text-xs font-semibold text-gray-900">{log.id}</p>
                </td>
                <td className="px-2 py-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{log.username}</p>
                    {log.user_email && (
                      <p className="text-xs text-gray-500">{log.user_email}</p>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <Badge variant={getActionBadgeColor(log.action)} size="xs">
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-2 py-2">
                  <p className="text-xs text-gray-700">{log.table_name}</p>
                </td>
                <td className="px-2 py-2">
                  <p className="text-xs text-gray-700">{log.record_id}</p>
                </td>
                <td className="px-2 py-2">
                  <p className="text-xs text-gray-700">{log.ip_address}</p>
                </td>
                <td className="px-2 py-2">
                  <p className="text-xs text-gray-700">{formatDate(log.created_at)}</p>
                </td>
                <td className="px-2 py-2">
                  <div className="max-w-xs overflow-hidden">
                    {log.new_values && (
                      <div className="mb-0.5">
                        <span className="text-xs font-semibold text-green-600">New: </span>
                        <span className="text-xs text-gray-600 truncate">{formatValues(log.new_values)}</span>
                      </div>
                    )}
                    {log.old_values && (
                      <div>
                        <span className="text-xs font-semibold text-red-600">Old: </span>
                        <span className="text-xs text-gray-600 truncate">{formatValues(log.old_values)}</span>
                      </div>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AuditLogTable
