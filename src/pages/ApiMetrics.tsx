import { useState, useEffect } from 'react'
import { metricsService } from '../services/metricsService'
import type { ApiMetric } from '../types/metrics'
import toast from 'react-hot-toast'
import { ArrowUpIcon, ArrowDownIcon, ClockIcon, ServerIcon, ArrowsRightLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading metrics...</p>
        </div>
      </div>
    )
  }

  const stats = getTotalStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <ChartBarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                API Metrics Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Real-time API endpoint performance monitoring and analytics
              </p>
            </div>
          </div>
          <button
            onClick={fetchMetrics}
            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </span>
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 border border-gray-100 hover:border-blue-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow group-hover:scale-110 transition-transform duration-300">
              <ServerIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Total</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">API Calls</div>
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {stats.totalCalls.toLocaleString()}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">Total requests processed</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 border border-gray-100 hover:border-purple-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow group-hover:scale-110 transition-transform duration-300">
              <ClockIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Avg</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Response Time</div>
          <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            {formatTime(stats.avgResponseTime)}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">Average across all endpoints</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 border border-gray-100 hover:border-yellow-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow group-hover:scale-110 transition-transform duration-300">
              <ArrowsRightLeftIcon className="w-4 h-4 text-white rotate-90" />
            </div>
            <span className="text-[10px] font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Sent</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Data Sent</div>
          <div className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
            {formatBytes(stats.totalSent)}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">Total outbound traffic</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 border border-gray-100 hover:border-orange-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow group-hover:scale-110 transition-transform duration-300">
              <ArrowsRightLeftIcon className="w-4 h-4 text-white -rotate-90" />
            </div>
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Received</span>
          </div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Data Received</div>
          <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            {formatBytes(stats.totalReceived)}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">Total inbound traffic</p>
          </div>
        </motion.div>
      </div>

      {/* Metrics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-bold text-gray-900">Endpoint Performance</h2>
          <p className="text-sm text-gray-500 mt-1">Detailed metrics for each API endpoint</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 via-blue-50/30 to-indigo-50/20">
              <tr>
                <th
                  onClick={() => handleSort('path')}
                  className="group px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span>API Path</span>
                    <SortIcon field="path" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_calls')}
                  className="group px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span>Calls</span>
                    <SortIcon field="total_calls" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_time_ms')}
                  className="group px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span>Avg Time</span>
                    <SortIcon field="avg_time_ms" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('min_time_ms')}
                  className="group px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span>Min Time</span>
                    <SortIcon field="min_time_ms" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('max_time_ms')}
                  className="group px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span>Max Time</span>
                    <SortIcon field="max_time_ms" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_sent_bytes')}
                  className="group px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span>Data Sent</span>
                    <SortIcon field="total_sent_bytes" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_received_bytes')}
                  className="group px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span>Data Received</span>
                    <SortIcon field="total_received_bytes" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedMetrics.map((metric, index) => (
                <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-150 group">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    <code className="bg-gray-100 group-hover:bg-blue-100 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors">
                      {metric.path}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {metric.total_calls.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {formatTime(metric.avg_time_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                    {formatTime(metric.min_time_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                    {formatTime(metric.max_time_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {formatBytes(metric.total_sent_bytes)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                    {formatBytes(metric.total_received_bytes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {metrics.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No metrics data available</p>
            <p className="text-sm text-gray-400 mt-1">Data will appear here once API calls are made</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
