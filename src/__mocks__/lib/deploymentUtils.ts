// Mock deploymentUtils for testing
export const isProduction = (): boolean => false

export const getApiBaseUrl = (): string => 'http://localhost:3000'

export const debugEnv = (): void => {
  // Mock function - no-op in tests
}
