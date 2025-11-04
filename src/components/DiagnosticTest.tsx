import React, { useState } from 'react'

const DiagnosticTest: React.FC = () => {
  const [clickCount, setClickCount] = useState(0)
  const [message, setMessage] = useState('')

  const handleClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)
    setMessage(`Button clicked ${newCount} times`)
    console.log('Diagnostic test - button clicked:', newCount)
  }

  const handleApiTest = async () => {
    try {
      console.log('Testing API connection...')
      setMessage('Testing API...')
      
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setMessage('API connection successful!')
        console.log('API test successful')
      } else {
        setMessage(`API returned status: ${response.status}`)
        console.log('API test failed:', response.status)
      }
    } catch (error) {
      console.error('API test error:', error)
      setMessage(`API test error: ${error}`)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Diagnostic Test</h2>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={handleClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Test Click (Count: {clickCount})
          </button>
        </div>
        
        <div>
          <button
            onClick={handleApiTest}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Test API Connection
          </button>
        </div>
        
        {message && (
          <div className="p-3 bg-gray-100 rounded">
            Message: {message}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          Check the browser console (F12) for additional diagnostic messages.
        </div>
      </div>
    </div>
  )
}

export default DiagnosticTest

