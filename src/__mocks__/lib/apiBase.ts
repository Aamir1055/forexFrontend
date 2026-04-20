// Mock apiBase for testing
export const buildApiUrl = (path: string): string => {
  return `http://localhost:3000${path}`
}

export const getApiBaseUrl = (): string => {
  return 'http://localhost:3000'
}
