import { useState, useEffect } from 'react'
import { metricsService } from '../services/metricsService'
import type { ApiMetric } from '../types/metrics'
import toast from 'react-hot-toast'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

type SortField = keyof ApiMetric
type SortOrder = 'asc' | 'desc'

export default function ApiMetrics() {
  const [metrics, setMetrics] = useState<ApiMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('total_calls')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const data = await metricsService.getMetrics()
      setMetrics(data.metrics)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      toast.error('Failed to load API metrics')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedMetrics = Array.isArray(metrics) ? [...metrics].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    return sortOrder === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  }) : []

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatTime = (ms: number) => {
    if (ms < 1) return `${ms.toFixed(2)} ms`
    if (ms < 1000) return `${ms.toFixed(2)} ms`
    return `${(ms / 1000).toFixed(2)} s`
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 inline ml-1" />
    )
  }

  const getTotalStats = () => {
    if (!metrics || metrics.length === 0) {
      return { totalCalls: 0, totalSent: 0, totalReceived: 0, avgResponseTime: 0 }
    }
    
    const totalCalls = metrics.reduce((sum, m) => sum + m.total_calls, 0)
    const totalSent = metrics.reduce((sum, m) => sum + m.total_sent_bytes, 0)
    const totalReceived = metrics.reduce((sum, m) => sum + m.total_received_bytes, 0)
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.avg_time_ms, 0) / metrics.length

    return { totalCalls, totalSent, totalReceived, avgResponseTime }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = getTotalStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Metrics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitor API endpoint performance and usage statistics
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total API Calls</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {stats.totalCalls.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Avg Response Time</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {formatTime(stats.avgResponseTime)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Data Sent</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {formatBytes(stats.totalSent)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Data Received</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {formatBytes(stats.totalReceived)}
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('path')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  API Path <SortIcon field="path" />
                </th>
                <th
                  onClick={() => handleSort('total_calls')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Total Calls <SortIcon field="total_calls" />
                </th>
                <th
                  onClick={() => handleSort('avg_time_ms')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Avg Time <SortIcon field="avg_time_ms" />
                </th>
                <th
                  onClick={() => handleSort('min_time_ms')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Min Time <SortIcon field="min_time_ms" />
                </th>
                <th
                  onClick={() => handleSort('max_time_ms')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Max Time <SortIcon field="max_time_ms" />
                </th>
                <th
                  onClick={() => handleSort('total_sent_bytes')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Data Sent <SortIcon field="total_sent_bytes" />
                </th>
                <th
                  onClick={() => handleSort('total_received_bytes')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Data Received <SortIcon field="total_received_bytes" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMetrics.map((metric, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.path}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {metric.total_calls.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTime(metric.avg_time_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTime(metric.min_time_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTime(metric.max_time_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatBytes(metric.total_sent_bytes)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatBytes(metric.total_received_bytes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {metrics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No metrics data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
