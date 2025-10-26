// Utility functions for handling redirects in deployment environments
// Handles both development and production deployments with correct base paths

/**
 * Detect if we're in production mode
 */
const isProduction = (): boolean => {
  // Multiple checks to ensure we detect production correctly
  return import.meta.env.PROD || 
         import.meta.env.MODE === 'production' || 
         !import.meta.env.DEV
}

/**
 * Get the correct base path for the current deployment
 */
export const getBasePath = (): string => {
  // In development, use root path
  if (!isProduction()) {
    return '/'
  }
  
  // Check current URL to determine if we're in admin panel
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    if (currentPath.startsWith('/brk-eye-adm')) {
      return '/brk-eye-adm/'
    }
  }
  
  // Default to admin panel path in production
  return '/brk-eye-adm/'
}

/**
 * Get the correct login path for the current deployment
 */
export const getLoginPath = (): string => {
  const basePath = getBasePath()
  return `${basePath}login`
}

/**
 * Get the correct dashboard path for the current deployment
 */
export const getDashboardPath = (): string => {
  const basePath = getBasePath()
  return basePath
}

/**
 * Redirect to login page with correct path
 */
export const redirectToLogin = (): void => {
  console.log('🔒 redirectToLogin called')
  console.log('🔒 isProduction:', isProduction())

  // Prefer explicit admin base URL if provided
  const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
  const base = envBase && envBase.trim().length > 0
    ? envBase
    : `${window.location.protocol}//${window.location.host}/brk-eye-adm`
  const normalized = base.endsWith('/') ? base : `${base}/`
  const absoluteUrl = `${normalized}login`
  // Avoid repeated redirects causing Chromium throttling
  if (typeof window !== 'undefined') {
    if (window.location.href === absoluteUrl) return
    const now = Date.now()
    const last = Number(sessionStorage.getItem('lastRedirectTs') || '0')
    if (now - last < 800) return
    sessionStorage.setItem('lastRedirectTs', String(now))
    console.log('🔒 Redirecting to:', absoluteUrl)
    window.location.assign(absoluteUrl)
  }
}

/**
 * Redirect to dashboard with correct path
 */
export const redirectToDashboard = (): void => {
  console.log('🚀 redirectToDashboard called')
  console.log('🚀 isProduction:', isProduction())
  console.log('🚀 import.meta.env.DEV:', import.meta.env.DEV)
  console.log('🚀 import.meta.env.PROD:', import.meta.env.PROD)
  console.log('🚀 import.meta.env.MODE:', import.meta.env.MODE)
  
  // Prefer explicit admin base URL if provided
  const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
  const base = envBase && envBase.trim().length > 0
    ? envBase
    : `${window.location.protocol}//${window.location.host}/brk-eye-adm`
  const absoluteUrl = base.endsWith('/') ? base : `${base}/`
  // Avoid repeated redirects causing Chromium throttling
  if (typeof window !== 'undefined') {
    if (window.location.href === absoluteUrl) return
    const now = Date.now()
    const last = Number(sessionStorage.getItem('lastRedirectTs') || '0')
    if (now - last < 800) return
    sessionStorage.setItem('lastRedirectTs', String(now))
    console.log('🚀 Redirecting to:', absoluteUrl)
    window.location.assign(absoluteUrl)
  }
}

/**
 * Get the correct absolute URL for redirects
 * @param path - relative path (e.g., '/dashboard', '/login')
 */
export const getCorrectUrl = (path: string): string => {
  const basePath = getBasePath()
  
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Handle empty path (root)
  if (!cleanPath) {
    return basePath
  }
  
  return `${basePath}${cleanPath}`
}

/**
 * Navigate to a path with correct base URL
 * @param path - relative path
 */
export const navigateToPath = (path: string): void => {
  const correctUrl = getCorrectUrl(path)
  window.location.href = correctUrl
}