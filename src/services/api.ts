import axios from 'axios'
import { getApiBaseUrl } from '../lib/apiBase'

// Redirect utility
const redirectToLogin = () => {
  const isDev = (import.meta as any).env?.DEV
  const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
  const base = envBase && envBase.trim().length > 0
    ? envBase
    : isDev
      ? `${window.location.protocol}//${window.location.host}`
      : `${window.location.protocol}//${window.location.host}/brk-eye-adm`
  const normalized = base.endsWith('/') ? base : `${base}/`
  const absoluteUrl = `${normalized}login`
  console.log('🔒 [LOGOUT] Redirecting to:', absoluteUrl)
  window.location.href = absoluteUrl
}

// Timestamp helper for logs
const ts = () => new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

console.log(`🔧 [${ts()}] API base URL: ${getApiBaseUrl()}`)

// Separate instance for refresh calls — no interceptors to avoid loops
const refreshApi = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Refresh state
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

// ─── REQUEST INTERCEPTOR: attach access token ───
api.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/refresh') || 
                          config.url?.includes('/auth/verify-2fa')
    if (isAuthEndpoint) return config

    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`📤 [${ts()}] REQUEST ${config.method?.toUpperCase()} ${config.url}`)
    } else {
      console.warn(`⚠️ [${ts()}] REQUEST ${config.url} — No access token!`)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── RESPONSE INTERCEPTOR: 401/403 → refresh → retry → or logout ───
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [${ts()}] RESPONSE ${response.status} ${response.config.url}`)
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // No response = network error / CORS block
    if (!error.response) {
      console.error(`🌐 [${ts()}] NETWORK ERROR: No response for ${originalRequest?.url} — Check CORS or server`)
      return Promise.reject(error)
    }

    console.log(`🔴 [${ts()}] RESPONSE ${status} ${originalRequest?.url} | body:`, error.response?.data)

    // Never retry auth endpoints (prevents infinite loop)
    if (originalRequest.url?.includes('/auth/refresh') || 
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/verify-2fa')) {
      console.log(`⏩ [${ts()}] Skipping refresh for auth endpoint: ${originalRequest.url}`)
      return Promise.reject(error)
    }

    // ─── GOT 401 or 403: Access token expired → try refresh ───
    // Both 401 and 403 can indicate expired access token depending on backend.
    // If it's truly a permission issue (not expired token), the retry after refresh
    // will get 403 again and pass through since _retry is already true.
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      console.log(`🔄 [${ts()}] GOT ${status} on ${originalRequest.url} — Will attempt token refresh`)

      // Queue concurrent requests while refreshing
      if (isRefreshing) {
        console.log(`⏳ [${ts()}] Refresh in progress, queuing: ${originalRequest.url}`)
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        console.error(`❌ [${ts()}] No refresh token in localStorage — Logging out`)
        isRefreshing = false
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('authUser')
        redirectToLogin()
        return Promise.reject(error)
      }

      console.log(`🔄 [${ts()}] CALLING /api/auth/refresh with current refresh token ...`)

      try {
        // Send refresh token in BOTH Authorization header AND body
        // to cover both possible backend expectations
        const response = await refreshApi.post('/api/auth/refresh', 
          { refresh_token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshToken}`
            }
          }
        )

        console.log(`✅ [${ts()}] REFRESH SUCCESS — Server responded ${response.status}`)
        console.log(`✅ [${ts()}] REFRESH response data:`, response.data)

        const responseData = response.data?.data || response.data
        const newAccessToken = responseData?.access_token || responseData?.accessToken || responseData?.token
        const newRefreshToken = responseData?.refresh_token || responseData?.refreshToken

        if (!newAccessToken) {
          console.error(`❌ [${ts()}] REFRESH response missing access_token. Full response:`, JSON.stringify(response.data))
          throw new Error('No access token in refresh response')
        }

        // Store new access token
        localStorage.setItem('authToken', newAccessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
        console.log(`✅ [${ts()}] NEW ACCESS TOKEN stored successfully`)

        // Store rotated refresh token if provided
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
          console.log(`✅ [${ts()}] NEW REFRESH TOKEN stored (rotated)`)
        } else {
          console.log(`ℹ️ [${ts()}] Refresh token unchanged (no rotation)`)
        }

        // Retry the original failed request with new access token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        console.log(`🔄 [${ts()}] RETRYING original request: ${originalRequest.url}`)

        processQueue(null, newAccessToken)
        window.dispatchEvent(new CustomEvent('token:refreshed', { detail: { token: newAccessToken } }))

        return api(originalRequest)

      } catch (refreshError: any) {
        const rStatus = refreshError?.response?.status
        const rData = refreshError?.response?.data
        const rMsg = rData?.message || refreshError.message

        console.error(`❌ [${ts()}] REFRESH FAILED — Status: ${rStatus || 'N/A'} | ${rMsg}`)
        console.error(`❌ [${ts()}] REFRESH error response:`, rData)
        console.error(`🔒 [${ts()}] REFRESH TOKEN EXPIRED/INVALID — Clearing tokens & redirecting to login`)

        processQueue(refreshError, null)

        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('authUser')

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
export { refreshApi }
