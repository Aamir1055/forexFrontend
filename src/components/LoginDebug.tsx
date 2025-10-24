import React, { useState } from 'react'
import toast from 'react-hot-toast'

const LoginDebug: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAPIConnectivity = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      addResult('🔍 Testing API connectivity...')
      
      // Test 1: Basic connectivity
      const response = await fetch('http://185.136.159.142:8080/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        addResult('✅ API server is reachable')
      } else {
        addResult(`❌ API server responded with status: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ API connectivity failed: ${(error as Error).message}`)
    }
    
    // Test 2: Try login endpoint with correct credentials
    try {
      addResult('🔍 Testing login endpoint with admin/admin123...')
      
      const loginResponse = await fetch('http://185.136.159.142:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: 'admin', 
          password: 'admin123' 
        }),
      })
      
      const loginData = await loginResponse.json()
      addResult(`📝 Login response: ${JSON.stringify(loginData, null, 2)}`)
      
      if (loginData.status === 'success') {
        addResult('✅ Login endpoint is working with admin/admin123')
        if (loginData.data.requires_2fa) {
          addResult('⚠️ 2FA is required for this account')
          addResult('💡 Try disabling 2FA or contact admin')
        } else if (loginData.data.access_token) {
          addResult('🎉 Got access token! Login should work now.')
          addResult('💡 Try logging in with: admin / admin123')
        }
      } else {
        addResult('❌ Login failed with admin/admin123')
        addResult(`📋 Error: ${loginData.message || 'Unknown error'}`)
      }
    } catch (error) {
      addResult(`❌ Login test failed: ${(error as Error).message}`)
    }
    
    setIsLoading(false)
  }

  const testWithCustomCredentials = async () => {
    const username = prompt('Enter username (try: admin):')
    const password = prompt('Enter password (try: admin123):')
    
    if (!username || !password) return
    
    setIsLoading(true)
    addResult(`🔍 Testing login with credentials: ${username}`)
    
    try {
      const response = await fetch('http://185.136.159.142:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      const data = await response.json()
      addResult(`📝 Response: ${JSON.stringify(data, null, 2)}`)
      
      if (data.status === 'success') {
        addResult('✅ Login successful!')
        if (data.data.access_token) {
          addResult('🎉 Got access token - you can now login!')
          toast.success('Login test successful! Try logging in now.')
        }
        if (data.data.requires_2fa) {
          addResult('⚠️ 2FA is enabled - this might be blocking login')
        }
      } else {
        addResult(`❌ Login failed: ${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      addResult(`❌ Custom login failed: ${(error as Error).message}`)
    }
    
    setIsLoading(false)
  }

  const testAuthContextLogin = async () => {
    setIsLoading(true)
    addResult('🔍 Testing AuthContext login method...')
    
    try {
      // Simulate the AuthContext login
      const response = await fetch('http://185.136.159.142:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      })

      const data = await response.json()
      addResult(`📝 AuthContext method response: ${JSON.stringify(data, null, 2)}`)

      if (data.status === 'success' && data.data.requires_2fa) {
        addResult('⚠️ 2FA is required - AuthContext shows alert and returns false')
        addResult('💡 This is why login fails! 2FA needs to be disabled or handled')
      } else if (data.status === 'success' && data.data.access_token) {
        addResult('✅ AuthContext method should work')
      } else {
        addResult('❌ AuthContext method would fail')
      }
    } catch (error) {
      addResult(`❌ AuthContext test failed: ${(error as Error).message}`)
    }
    
    setIsLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 Login Debug Tool</h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testAPIConnectivity}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : '🧪 Test API & Default Login'}
            </button>
            
            <button
              onClick={testWithCustomCredentials}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 ml-4"
            >
              🔑 Test Custom Credentials
            </button>
            
            <button
              onClick={testAuthContextLogin}
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 ml-4"
            >
              🔍 Test AuthContext Method
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 ml-4"
            >
              🗑️ Clear Results
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            <div className="mb-2 text-gray-400">Debug Console:</div>
            {testResults.length === 0 ? (
              <div className="text-gray-500">Click a test button to start debugging...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Common Login Issues:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Wrong credentials:</strong> Try admin/admin123 or admin/password</li>
              <li>• <strong>2FA enabled:</strong> Contact admin to disable 2FA for testing</li>
              <li>• <strong>Server down:</strong> Check if API server is running</li>
              <li>• <strong>CORS issues:</strong> Check browser console for CORS errors</li>
              <li>• <strong>Network issues:</strong> Check internet connection</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-md border-2 border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">✅ Correct Database Credentials:</h3>
            <div className="text-sm text-green-800 space-y-1">
              <div className="font-bold">• Username: <code className="bg-green-200 px-2 py-1 rounded font-mono">admin</code> Password: <code className="bg-green-200 px-2 py-1 rounded font-mono">admin123</code></div>
              <div className="text-xs text-green-700 mt-2">👆 These are the credentials in your database</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <h3 className="font-semibold text-red-900 mb-2">🚨 Possible Issues:</h3>
            <div className="text-sm text-red-800 space-y-1">
              <div>• <strong>2FA Enabled:</strong> If 2FA is enabled, login will fail</div>
              <div>• <strong>AuthContext vs authService:</strong> Two different login methods might conflict</div>
              <div>• <strong>API URL:</strong> Check if the API URL is correct in development</div>
              <div>• <strong>CORS:</strong> Cross-origin requests might be blocked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginDebug