import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import { PermissionContext } from '../../contexts/PermissionContext'
import { User, Role } from '../../services/userService'

// Mock user data factory
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  failed_login_attempts: 0,
  last_failed_login: null,
  locked_until: null,
  two_factor_enabled: false,
  two_factor_secret: null,
  two_factor_backup_codes: null,
  two_factor_verified_at: null,
  force_two_factor: false,
  roles: [createMockRole()],
  ...overrides
})

// Mock role data factory
export const createMockRole = (overrides?: Partial<Role>): Role => ({
  id: 1,
  name: 'Admin',
  description: 'Administrator role',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides
})

// Mock multiple users
export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => createMockUser({
    id: i + 1,
    username: `user${i + 1}`,
    email: `user${i + 1}@example.com`,
    roles: [createMockRole({ id: (i % 3) + 1, name: ['Admin', 'Editor', 'Viewer'][i % 3] })]
  }))
}

// Mock auth context value
export const createMockAuthContext = (overrides?: any) => ({
  user: createMockUser(),
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  verify2FA: jest.fn(),
  logout: jest.fn(),
  ...overrides
})

// Mock permission context value
export const createMockPermissionContext = (overrides?: any) => ({
  permissions: ['users.view', 'users.create', 'users.edit', 'users.delete'],
  hasPermission: jest.fn().mockReturnValue(true),
  hasAnyPermission: jest.fn().mockReturnValue(true),
  hasAllPermissions: jest.fn().mockReturnValue(true),
  hasModuleAccess: jest.fn().mockReturnValue(true),
  isLoading: false,
  ...overrides
})

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: any
  permissionValue?: any
  queryClient?: QueryClient
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  {
    authValue,
    permissionValue,
    queryClient,
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const mockAuthValue = authValue || createMockAuthContext()
  const mockPermissionValue = permissionValue || createMockPermissionContext()

  window.history.pushState({}, 'Test page', route)

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthValue}>
            <PermissionContext.Provider value={mockPermissionValue}>
              {children}
            </PermissionContext.Provider>
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: testQueryClient,
    mockAuthValue,
    mockPermissionValue
  }
}

// Utility to wait for loading states to resolve
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

// Create mock API responses
export const createMockUsersResponse = (users: User[], page = 1, limit = 10) => ({
  data: {
    users,
    pagination: {
      limit,
      page,
      pages: Math.ceil(users.length / limit),
      total: users.length
    }
  },
  message: 'Users fetched successfully',
  status: 'success'
})

// Mock toast notifications
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  custom: jest.fn(),
}

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => mockToast.success(...args),
    error: (...args: any[]) => mockToast.error(...args),
    loading: (...args: any[]) => mockToast.loading(...args),
    custom: (...args: any[]) => mockToast.custom(...args),
  },
  Toaster: () => null,
}))

// Re-export everything from RTL
export * from '@testing-library/react'
export { renderWithProviders as render }
