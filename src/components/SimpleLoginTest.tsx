import React, { useState } from 'react'

const SimpleLoginTest: React.FC = () => {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      console.log('Starting login test...')
      
      const response = await fetch('http://185.136.159.142:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: 'admin', 
          password: 'admin123' 
        }),
      })
      
      console.log('Response received:', response)
      console.log('Status:', response.status)
      console.log('OK:', response.ok)
      
      if (!response.ok) {
        setResult(`❌ HTTP Error: ${response.status} ${response.statusText}`)
        return
      }
      
      const data = await response.json()
      console.log('Data:', data)
      
      if (data.status === 'success') {
        setResult(`✅ SUCCESS! Got token: ${data.data?.access_token ? 'YES' : 'NO'}`)
      } else {
        setResult(`❌ API Error: ${data.message || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Network error:', error)
      setResult(`❌ Network Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testServerHealth = async () => {
    setLoading(true)
    setResult('Testing server...')
    
    try {
      const response = await fetch('http://185.136.159.142:8080/', {
        method: 'GET',
      })
      
      if (response.ok) {
        setResult('✅ Server is reachable!')
      } else {
        setResult(`❌ Server error: ${response.status}`)
      }
    } catch (error) {
      setResult(`❌ Cannot reach server: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 Simple Login Test</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testServerHealth}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : '🌐 Test Server Health'}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : '🔑 Test Login (admin/admin123)'}
          </button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm min-h-[100px]">
          <div className="text-gray-400 mb-2">Test Result:</div>
          {result || 'Click a button to start testing...'}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded">
          <h3 className="font-semibold text-yellow-900 mb-2">💡 Instructions:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>First test server health to see if the server is reachable</li>
            <li>Then test login with admin/admin123</li>
            <li>Check browser console (F12) for detailed logs</li>
            <li>If both fail, the server might be down or URL is wrong</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 Browser Console Test:</h3>
          <p className="text-sm text-blue-800 mb-2">Copy and paste this in browser console (F12):</p>
          <div className="bg-blue-100 p-2 rounded text-xs font-mono break-all">
            fetch('http://185.136.159.142:8080/api/auth/login', &#123;method: 'POST', headers: &#123;'Content-Type': 'application/json'&#125;, body: JSON.stringify(&#123;username: 'admin', password: 'admin123'&#125;)&#125;).then(r =&gt; r.json()).then(console.log).catch(console.error)
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleLoginTest