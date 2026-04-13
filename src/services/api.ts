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

// Startup debug
console.log('🔧 API base URL resolved to:', getApiBaseUrl())

// Create a separate instance for refresh calls to avoid interceptor loops
const refreshApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
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

// Helper to check if JWT is expired
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    if (!exp) return true
    const now = Math.floor(Date.now() / 1000)
    // Consider expired if less than 30 seconds remaining
    return exp <= (now + 30)
  } catch {
    return true
  }
}

// Request interceptor: check expiry and refresh proactively if needed
api.interceptors.request.use(
  async (config) => {
    // Skip token logic for auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/refresh') || 
                          config.url?.includes('/auth/verify-2fa')
    
    if (isAuthEndpoint) {
      return config
    }

    let token = localStorage.getItem('authToken')
    const refreshToken = localStorage.getItem('refreshToken')

    // Proactive refresh: if token expired and we have refresh token, refresh first
    if (isTokenExpired(token) && refreshToken && !isRefreshing) {
      console.log('🔄 Token expired, refreshing before request to:', config.url)
      isRefreshing = true
      
      try {
        const response = await refreshApi.post('/api/auth/refresh', { 
          refresh_token: refreshToken 
        })
        
        const newAccessToken = response.data?.data?.access_token
        if (newAccessToken) {
          localStorage.setItem('authToken', newAccessToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
          token = newAccessToken
          console.log('✅ Proactive token refresh successful')
          window.dispatchEvent(new CustomEvent('token:refreshed', { 
            detail: { token: newAccessToken, proactive: true } 
          }))
        }
      } catch (err) {
        console.error('❌ Proactive refresh failed:', err)
        // Let the request proceed; if token is invalid, backend will return 401
      } finally {
        isRefreshing = false
      }
    }

    // Attach current token (possibly refreshed)
    token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('📤 Request to:', config.url, '| Has token:', true)
    } else {
      console.warn('⚠️ No auth token found for request:', config.url)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Log ALL errors for debugging
    console.log('🔴 Response Interceptor Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      hasResponse: !!error.response,
      retry: originalRequest?._retry
    })

    // Network error fallback: attempt refresh if token likely expired
    if (!error.response) {
      // Likely CORS / network / DNS. Surface clearer diagnostic once per request.
      if (!originalRequest._networkLogged) {
        originalRequest._networkLogged = true
        console.error('🌐 Network-level failure (no response). Possible CORS/preflight rejection for:', originalRequest.url)
        console.info('🔍 Diagnose: Verify backend CORS allows Origin, Authorization, Content-Type for method', originalRequest.method?.toUpperCase())
      }
      return Promise.reject(error)
    }
    
    // Don't retry refresh token requests or login requests to prevent infinite loops
    if (originalRequest.url?.includes('/auth/refresh') || 
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/verify-2fa')) {
      console.log('🔒 Auth endpoint failed, not retrying:', originalRequest.url)
      return Promise.reject(error)
    }
    
    // Handle 403 (Forbidden) separately — user is authenticated but lacks permission
    // Do NOT trigger token refresh or logout for permission errors
    if (error.response?.status === 403) {
      console.warn('⛔ 403 Forbidden — Access denied for:', originalRequest.url)
      // Let the calling code handle the 403 (e.g., show "Access Denied" UI)
      return Promise.reject(error)
    }

    // Handle 401 errors (unauthorized / token expired) -> reactive refresh only
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.groupCollapsed('🔄 401 Intercepted')
      console.log('Request URL:', originalRequest.url)
      console.log('Retry flag:', originalRequest._retry)
      console.log('isRefreshing global:', isRefreshing)
      const currentAccess = localStorage.getItem('authToken')
      if (currentAccess) {
        try {
          const payload = JSON.parse(atob(currentAccess.split('.')[1]))
          console.log('Access token exp (unix):', payload.exp, 'now:', Math.floor(Date.now()/1000))
        } catch { console.log('Could not decode access token payload') }
      } else {
        console.log('No access token present in storage at 401 time')
      }
      console.log('Attempting refresh...')
      console.groupEnd()
      
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
          console.error('❌ LocalStorage keys:', Object.keys(localStorage))
          throw new Error('No refresh token available')
        }

        console.log('🔄 Refresh token found:', refreshToken.substring(0, 30) + '...')
        console.log('🔄 API Base URL:', getApiBaseUrl())
        
        // Send refresh_token ONLY after backend signals expiry (reactive pattern)
        console.log('🔄 Sending reactive refresh request')
        const response = await refreshApi.post('/api/auth/refresh', {
          refresh_token: refreshToken
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
        // Ensure all future requests use the fresh token immediately
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
        
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
        window.dispatchEvent(new CustomEvent('token:refreshed', { detail: { token: newAccessToken, reactive: true } }))
        window.dispatchEvent(new CustomEvent('token:refresh-status', { detail: { ok: true, at: Date.now() } }))
        
        return api(originalRequest)
      } catch (refreshError: any) {
        console.error('❌ Token refresh failed:', refreshError)
        console.error('❌ Refresh error details:', refreshError.response?.data || refreshError.message)
        processQueue(refreshError, null)
        
        // Only auto-logout if the refresh token was explicitly rejected by the backend (401/403)
        // For network errors, timeouts, or server errors — don't logout, just surface the error
        const refreshStatus = refreshError.response?.status
        if (refreshStatus === 401 || refreshStatus === 403 || !localStorage.getItem('refreshToken')) {
          console.log('🔒 Refresh token rejected or missing — clearing session and redirecting to login')
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          localStorage.removeItem('authUser')
          
          const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
          const base = envBase && envBase.trim().length > 0
            ? envBase
            : `${window.location.protocol}//${window.location.host}/brk-eye-adm`
          const normalized = base.endsWith('/') ? base : `${base}/`
          const absoluteUrl = `${normalized}login`
          
          window.dispatchEvent(new CustomEvent('token:refresh-status', { detail: { ok: false, at: Date.now(), error: refreshStatus } }))
          window.location.replace(absoluteUrl)
        } else {
          console.warn('⚠️ Refresh failed due to network/server error (not logging out):', refreshError.message)
          window.dispatchEvent(new CustomEvent('token:refresh-status', { detail: { ok: false, at: Date.now(), error: refreshStatus || 'network' } }))
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
