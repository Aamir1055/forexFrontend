import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/solid'
import { auditLogService } from '../services/auditLogService'
import { AuditLogFilters } from '../types'
import AuditLogTable from '../components/AuditLogTable'
import toast from 'react-hot-toast'

const AuditLogs: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    order: 'desc',
    sort: 'created_at'
  })
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [actionFilter, setActionFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [startDate, setStartDate] = useState('') // DD/MM/YYYY format for display
  const [endDate, setEndDate] = useState('') // DD/MM/YYYY format for display
  const [startDateValue, setStartDateValue] = useState('') // YYYY-MM-DD format for input
  const [endDateValue, setEndDateValue] = useState('') // YYYY-MM-DD format for input

  // Fetch audit logs (without search parameter since we filter client-side)
  const { data, isLoading } = useQuery(
    ['auditLogs', filters],
    () => {
      // Don't send search to API, we'll filter client-side
      const { search, ...apiFilters } = filters
      return auditLogService.getAuditLogs(apiFilters)
    },
    {
      keepPreviousData: true,
      retry: 1,
    }
  )

  const allLogs = data?.logs || []
  const pagination = data?.pagination

  // Client-side search filtering
  const logs = React.useMemo(() => {
    if (!searchTerm.trim()) return allLogs

    const searchLower = searchTerm.toLowerCase().trim()
    return allLogs.filter(log => {
      // Search across multiple fields
      const searchableText = [
        log.username?.toLowerCase() || '',
        log.user_email?.toLowerCase() || '',
        log.action?.toLowerCase() || '',
        log.table_name?.toLowerCase() || '',
        log.ip_address?.toLowerCase() || '',
        log.record_id?.toString() || '',
        log.id?.toString() || '',
        JSON.stringify(log.new_values || {}).toLowerCase(),
        JSON.stringify(log.old_values || {}).toLowerCase(),
      ].join(' ')

      return searchableText.includes(searchLower)
    })
  }, [allLogs, searchTerm])

  // No need for debounced search anymore since we're doing client-side filtering

  // Convert DD/MM/YYYY to ISO format for API
  const convertToISO = (dateStr: string): string | undefined => {
    if (!dateStr || dateStr.length !== 10) return undefined
    const [day, month, year] = dateStr.split('/')
    if (!day || !month || !year) return undefined
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`
  }

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const formatToDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  // Handle date picker change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartDateValue(value)
    setStartDate(formatToDisplay(value))
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndDateValue(value)
    setEndDate(formatToDisplay(value))
  }

  // Apply filters
  const applyFilters = () => {
    setFilters({
      ...filters,
      page: 1,
      search: searchTerm || undefined,
      action: actionFilter || undefined,
      table_name: tableFilter || undefined,
      start_date: convertToISO(startDate),
      end_date: convertToISO(endDate),
    })
    setCurrentPage(1)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setActionFilter('')
    setTableFilter('')
    setStartDate('')
    setEndDate('')
    setStartDateValue('')
    setEndDateValue('')
    setFilters({
      page: 1,
      limit: 20,
      order: 'desc',
      sort: 'created_at'
    })
    setCurrentPage(1)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setFilters({ ...filters, page })
  }

  // Handle sorting
  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newOrder)
    setFilters({
      ...filters,
      sort: field,
      order: newOrder,
      page: 1
    })
    setCurrentPage(1)
  }

  // Export audit logs
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await auditLogService.exportAuditLogs({
        format,
        action: actionFilter || undefined,
        table_name: tableFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: searchTerm || undefined,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Audit logs exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to export audit logs')
    }
  }

  // Common action types for filtering
  const actionTypes = [
    'LOGIN_SUCCESS',
    'LOGOUT',
    'BROKER_LOGIN',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'BROKER_CREATED',
    'BROKER_UPDATED',
    'BROKER_DELETED',
    'GROUP_CREATED',
    'GROUP_UPDATED',
    'GROUP_DELETED',
  ]

  // Common table names for filtering
  const tableNames = [
    'users',
    'brokers',
    'groups',
    'broker_profiles',
    'roles',
  ]

  return (
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
                  <p className="text-sm text-gray-500">Track all system activities and changes</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm ${
                    showFilters
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                <div className="relative">
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-sm"
                    onClick={() => {
                      const dropdown = document.getElementById('export-dropdown')
                      dropdown?.classList.toggle('hidden')
                    }}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <div
                    id="export-dropdown"
                    className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                  >
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 last:rounded-b-lg"
                    >
                      Export as JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-6">
        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Action Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Actions</option>
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Table Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Table
              </label>
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Tables</option>
                {tableNames.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Start Date (DD/MM/YYYY)
              </label>
              <input
                type="date"
                value={startDateValue}
                onChange={handleStartDateChange}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              {startDate && (
                <p className="text-[10px] text-gray-500 mt-0.5">{startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                End Date (DD/MM/YYYY)
              </label>
              <input
                type="date"
                value={endDateValue}
                onChange={handleEndDateChange}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              {endDate && (
                <p className="text-[10px] text-gray-500 mt-0.5">{endDate}</p>
              )}
            </div>
          </div>

            {/* Filter Actions */}
            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={applyFilters}
                className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Pagination and Table */}
        <div className="mt-4 mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-gray-600">Show</span>
            <select
              value={filters.limit}
              onChange={(e) => {
                setFilters({ ...filters, limit: Number(e.target.value), page: 1 })
                setCurrentPage(1)
              }}
              className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-600">entries</span>
          </div>
          <div className="text-xs text-gray-700">
            {searchTerm ? (
              `Showing ${logs.length} filtered result${logs.length !== 1 ? 's' : ''} (from ${pagination?.total_items || 0} total)`
            ) : (
              `Showing ${logs.length === 0 ? 0 : ((currentPage - 1) * (filters.limit || 20)) + 1} to ${Math.min(currentPage * (filters.limit || 20), pagination?.total_items || 0)} of ${pagination?.total_items || 0} results`
            )}
          </div>
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-700">
                Page {currentPage} of {pagination.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.total_pages}
                className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AuditLogTable 
            logs={logs} 
            isLoading={isLoading} 
            onSort={handleSort}
            currentSort={{ field: sortField, order: sortOrder }}
          />
        </motion.div>
      </main>
    </div>
  )
}

export default AuditLogs
