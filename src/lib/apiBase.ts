// Centralized API base URL helper
// Priority:
// 1) VITE_API_BASE_URL env (full origin)
// 2) Hardcoded production API URL with SSL

export function getApiBaseUrl(): string {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  // Use environment variable if set, otherwise use hardcoded SSL API domain
  const base = (envBase && envBase.trim().length > 0) ? envBase.trim() : 'https://api.brokereye.work.gd'
  // Normalize by removing trailing slash
  return base.endsWith('/') ? base.slice(0, -1) : base
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl()
  // Ensure single slash between base and path
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

