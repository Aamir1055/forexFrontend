import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import 'whatwg-fetch'
import { BroadcastChannel } from 'worker_threads'

// Polyfill BroadcastChannel for MSW v2
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = BroadcastChannel as any
}

// Mock modules that use import.meta BEFORE any imports
jest.mock('./services/api', () => {
  const axios = require('axios')
  const mockApi = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' }
  })
  return { __esModule: true, default: mockApi }
})

jest.mock('./lib/apiBase', () => ({
  buildApiUrl: (path: string) => `http://localhost:3000${path}`,
  getApiBaseUrl: () => 'http://localhost:3000'
}))

jest.mock('./lib/deploymentUtils', () => ({
  isProduction: () => false,
  getApiBaseUrl: () => 'http://localhost:3000',
  debugEnv: () => {}
}))

// Polyfill for TextEncoder/TextDecoder (required by MSW)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any
  global.TextDecoder = TextDecoder as any
}

// Mock import.meta
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_ADMIN_BASE_URL: 'http://localhost:3000',
      VITE_API_BASE_URL: 'http://localhost:3000',
      DEV: true,
      PROD: false,
      MODE: 'test'
    }
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
