import axios from 'axios'
import { getApiBaseUrl } from '../lib/apiBase'

// Import the redirect utility
const redirectToLogin = () => {
  const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
  const base = envBase && envBase.trim().length > 0
    ? envBase
    : `${window.location.protocol}//${window.location.host}/brk-eye-adm`
  const normalized = base.endsWith('/') ? base : `${base}/`
  const absoluteUrl = `${normalized}login`
  console.log('🔒 API Error - Redirecting to login:', absoluteUrl)
  window.location.href = absoluteUrl
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create a separate instance for refresh calls to avoid interceptor loops
const refreshApi = axios.create({
  baseURL: getApiBaseUrl(),
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
    
    // Don't retry refresh token requests or login requests to prevent infinite loops
    if (originalRequest.url?.includes('/api/auth/refresh') || 
        originalRequest.url?.includes('/api/auth/login') ||
        originalRequest.url?.includes('/api/auth/verify-2fa')) {
      console.log('🔒 Auth endpoint failed, not retrying:', originalRequest.url)
      return Promise.reject(error)
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 401 detected, attempting token refresh...')
      
      if (isRefreshing) {
        console.log('⏳ Refresh already in progress, queuing request...')
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
          console.error('❌ No refresh token available')
          throw new Error('No refresh token available')
        }

        console.log('🔄 Calling refresh token API...')
        // Use separate axios instance to avoid interceptor loop
        const response = await refreshApi.post('/api/auth/refresh', { 
          refresh_token: refreshToken 
        })
        
        const newToken = response.data.data.access_token
        localStorage.setItem('authToken', newToken)
        console.log('✅ Token refreshed successfully')
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        // Process any queued requests
        processQueue(null, newToken)
        
        return api(originalRequest)
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError, null)
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

export default api