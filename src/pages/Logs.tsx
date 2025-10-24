import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { logsService, LogContentResponse } from '../services/logsService'
import toast from 'react-hot-toast'

const Logs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'mt5'>('system')
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(100)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRegex, setIsRegex] = useState(false)
  const [isTailMode, setIsTailMode] = useState(false)
  const [logContent, setLogContent] = useState<LogContentResponse | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  // Fetch log files list
  const { data: logFiles, isLoading: isLoadingFiles } = useQuery(
    ['logs-list'],
    () => logsService.listLogs(),
    {
      refetchOnWindowFocus: false,
      retry: false,
      onError: (error: any) => {
        const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load log files'
        toast.error(`Logs API Error: ${errorMsg}`)
        console.error('Logs API error:', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          url: error?.config?.url,
          data: error?.response?.data,
          error
        })
      }
    }
  )

  // Auto-select first file when tab changes
  useEffect(() => {
    if (logFiles) {
      const files = activeTab === 'system' ? logFiles.system_logs : logFiles.mt5_logs
      if (files && files.length > 0 && !selectedFile) {
        setSelectedFile(files[0].filename)
      }
    }
  }, [activeTab, logFiles, selectedFile])

  // Fetch log content
  const fetchLogContent = async () => {
    if (!selectedFile) return

    setIsLoadingContent(true)
    try {
      const params = {
        offset: isTailMode ? undefined : offset,
        limit,
        tail: isTailMode || undefined,
        search: searchTerm || undefined,
        regex: isRegex || undefined
      }

      const content = activeTab === 'system'
        ? await logsService.getSystemLog(selectedFile, params)
        : await logsService.getMT5Log(selectedFile, params)

      setLogContent(content)
    } catch (error: any) {
      toast.error('Failed to fetch log content')
      console.error(error)
    } finally {
      setIsLoadingContent(false)
    }
  }

  useEffect(() => {
    if (selectedFile) {
      fetchLogContent()
    }
  }, [selectedFile, offset, limit, isTailMode])

  const handleSearch = () => {
    setOffset(0)
    fetchLogContent()
  }

  const handleTabChange = (tab: 'system' | 'mt5') => {
    setActiveTab(tab)
    setSelectedFile('')
    setLogContent(null)
    setOffset(0)
    setSearchTerm('')
    setIsTailMode(false)
  }

  const currentFiles = logFiles && logFiles[activeTab === 'system' ? 'system_logs' : 'mt5_logs'] || []

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`
  }

  // const formatDate = (timestamp: number) => {
  //   return new Date(timestamp * 1000).toLocaleString()
  // }

  return (
    <div className="h-screen bg-gray-50 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">System Logs</h1>
                  <p className="text-sm text-gray-500">View and search system and MT5 log files</p>
                </div>
              </div>

              {/* Tabs in header */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTabChange('system')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'system'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  System ({logFiles?.system_logs?.length || 0})
                </button>
                <button
                  onClick={() => handleTabChange('mt5')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'mt5'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  MT5 ({logFiles?.mt5_logs?.length || 0})
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-6 overflow-y-auto">
        {/* Controls Card */}
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* File Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Log File</label>
              <select
                value={selectedFile}
                onChange={(e) => {
                  setSelectedFile(e.target.value)
                  setOffset(0)
                }}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={isLoadingFiles}
              >
                <option value="">-- Select File --</option>
                {currentFiles.map((file) => (
                  <option key={file.filename} value={file.filename}>
                    {file.filename} ({formatFileSize(file.size)})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Search Logs</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-4 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-end space-x-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-1.5 text-xs text-gray-700">Regex</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTailMode}
                  onChange={(e) => setIsTailMode(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-1.5 text-xs text-gray-700">Tail</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={handleSearch}
              disabled={isLoadingContent}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </div>

        {/* Pagination Controls */}
        {!isTailMode && logContent && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-gray-600">Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setOffset(0)
                }}
                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-xs"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
              <span className="text-xs text-gray-600">lines per page</span>
            </div>

            <div className="text-xs text-gray-600">
              Showing {offset + 1} - {Math.min(offset + logContent.returned_lines, logContent.total_lines)} of {logContent.total_lines} lines
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0 || isLoadingContent}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= logContent.total_lines || isLoadingContent}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Log Content */}
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gray-900 rounded-lg p-4 min-h-[600px] max-h-[600px] overflow-auto">
            {isLoadingContent ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : logContent && logContent.lines.length > 0 ? (
              <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                {logContent.lines.map((line, index) => (
                  <div key={index} className="hover:bg-gray-800 transition-colors">
                    {line}
                  </div>
                ))}
              </pre>
            ) : selectedFile ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No log content available
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Select a log file to view its content
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Logs
