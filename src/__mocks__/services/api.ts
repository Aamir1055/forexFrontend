import axios from 'axios'

// Mock axios instance for testing
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Mock interceptors
api.interceptors.request.use((config) => config)
api.interceptors.response.use((response) => response)

export default api
