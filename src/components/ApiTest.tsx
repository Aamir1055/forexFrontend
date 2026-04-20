import React, { useState } from 'react'

const ApiTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testApiConnection = async () => {
    setIsLoading(true)
    setResults([])
    
    try {
      addResult('🔍 Testing API connection...')
      
      // Test basic connectivity
      const response = await fetch('http://185.136.159.142:8080/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        addResult('✅ API server is reachable')
      } else {
        addResult(`❌ API server returned: ${response.status} ${response.statusText}`)
      }
      
      // Test login endpoint
      addResult('🔍 Testing login endpoint...')
      const loginResponse = await fetch('http://185.136.159.142:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      })
      
      if (loginResponse.ok) {
        const data = await loginResponse.json()
        addResult('✅ Login endpoint is working')
        addResult(`📊 Response: ${JSON.stringify(data, null, 2)}`)
      } else {
        addResult(`❌ Login failed: ${loginResponse.status} ${loginResponse.statusText}`)
      }
      
    } catch (error) {
      addResult(`❌ Network error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="fixed top-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">API Test</h3>
        <button
          onClick={clearResults}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
      
      <button
        onClick={testApiConnection}
        disabled={isLoading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {isLoading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      <div className="max-h-64 overflow-y-auto">
        {results.map((result, index) => (
          <div key={index} className="text-sm mb-2 p-2 bg-gray-50 rounded">
            {result}
          </div>
        ))}
      </div>
      
      {results.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          Click "Test API Connection" to check if the infinite refresh loop is fixed
        </div>
      )}
    </div>
  )
}

export default ApiTest

