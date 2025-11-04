// Centralized API base URL helper
// Priority:
// 1) VITE_API_BASE_URL env (full origin, e.g. http://IP:PORT)
// 2) window.location.origin (assumes same-origin API or reverse proxy)

export function getApiBaseUrl(): string {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  const base = (envBase && envBase.trim().length > 0) ? envBase.trim() : window.location.origin
  // Normalize by removing trailing slash
  return base.endsWith('/') ? base.slice(0, -1) : base
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl()
  // Ensure single slash between base and path
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

