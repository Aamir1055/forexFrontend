import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'http://185.136.159.142:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create a separate instance for refresh calls to avoid interceptor loops
const refreshApi = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'http://185.136.159.142:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Don't retry refresh token requests to prevent infinite loops
    if (originalRequest.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error)
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Use separate axios instance to avoid interceptor loop
        const response = await refreshApi.post('/api/auth/refresh', { 
          refresh_token: refreshToken 
        })
        
        const newToken = response.data.data.access_token
        localStorage.setItem('authToken', newToken)
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        // Process any queued requests
        processQueue(null, newToken)
        
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError, null)
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

export default api