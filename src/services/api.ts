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
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create a separate instance for refresh calls to avoid interceptor loops
const refreshApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS credentials
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
    if (originalRequest.url?.includes('/auth/refresh') || 
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/verify-2fa')) {
      console.log('🔒 Auth endpoint failed, not retrying:', originalRequest.url)
      return Promise.reject(error)
    }
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 401 detected on URL:', originalRequest.url)
      console.log('🔄 Attempting token refresh...')
      
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
          console.error('❌ No refresh token available in localStorage')
          throw new Error('No refresh token available')
        }

        console.log('🔄 Refresh token found, calling API...')
        console.log('🔄 API Base URL:', getApiBaseUrl())
        
        // Use separate axios instance to avoid interceptor loop
        const response = await refreshApi.post('/api/auth/refresh', {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        })
        
        console.log('✅ Refresh API response status:', response.status)
        console.log('✅ Refresh API response data:', response.data)
        
        const responseData = response.data.data || response.data
        const newAccessToken = responseData.access_token || responseData.accessToken
        const newRefreshToken = responseData.refresh_token || responseData.refreshToken
        
        if (!newAccessToken) {
          console.error('❌ No access token in refresh response:', responseData)
          throw new Error('No access token received')
        }
        
        console.log('✅ New access token received')
        
        // Store the new access token
        localStorage.setItem('authToken', newAccessToken)
        
        // Update refresh token if provided
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
          console.log('✅ Both tokens refreshed successfully')
        } else {
          console.log('✅ Access token refreshed (refresh token unchanged)')
        }
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        
        // Process any queued requests
        processQueue(null, newAccessToken)
        
        // Broadcast token refresh event for WebSocket reconnection
        window.dispatchEvent(new CustomEvent('token:refreshed', { detail: { token: newAccessToken } }))
        
        return api(originalRequest)
      } catch (refreshError: any) {
        console.error('❌ Token refresh failed:', refreshError)
        console.error('❌ Refresh error details:', refreshError.response?.data || refreshError.message)
        processQueue(refreshError, null)
        
        // Always clear tokens when refresh fails
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('authUser')
        
        console.log('🔒 Refresh token failed - redirecting to login')
        
        // Immediately redirect to login without any delay
        const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
        const base = envBase && envBase.trim().length > 0
          ? envBase
          : `${window.location.protocol}//${window.location.host}/brk-eye-adm`
        const normalized = base.endsWith('/') ? base : `${base}/`
        const absoluteUrl = `${normalized}login`
        
        // Use replace to prevent back navigation to protected pages
        window.location.replace(absoluteUrl)
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
