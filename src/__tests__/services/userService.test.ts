import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { userService, CreateUserData, UpdateUserData } from '../../services/userService'
import { createMockUser, createMockUsers, createMockRole } from '../utils/test-utils'

// Create axios mock
const mock = new MockAdapter(axios)

describe('userService', () => {
  beforeEach(() => {
    mock.reset()
  })

  afterAll(() => {
    mock.restore()
  })

  describe('getUsers', () => {
    it('should fetch users with pagination', async () => {
      const mockUsers = createMockUsers(5)
      const mockResponse = {
        data: {
          users: mockUsers,
          pagination: {
            limit: 10,
            page: 1,
            pages: 1,
            total: 5
          }
        },
        message: 'Success',
        status: 'success'
      }

      mock.onGet('/api/users?page=1&limit=10').reply(200, mockResponse)

      const result = await userService.getUsers(1, 10)

      expect(result.data.users).toHaveLength(5)
      expect(result.data.pagination.total).toBe(5)
      expect(result.status).toBe('success')
    })

    it('should handle empty user list', async () => {
      const mockResponse = {
        data: {
          users: [],
          pagination: {
            limit: 10,
            page: 1,
            pages: 0,
            total: 0
          }
        }
      }

      mock.onGet('/api/users?page=1&limit=10').reply(200, mockResponse)

      const result = await userService.getUsers(1, 10)

      expect(result.data.users).toHaveLength(0)
      expect(result.data.pagination.total).toBe(0)
    })

    it('should normalize response structure', async () => {
      // Test various response formats from backend
      const mockResponse = {
        users: createMockUsers(2),
        pagination: { limit: 10, page: 1, pages: 1, total: 2 }
      }

      mock.onGet('/api/users?page=1&limit=10').reply(200, mockResponse)

      const result = await userService.getUsers(1, 10)

      // Should normalize to { data: { users, pagination } }
      expect(result.data).toHaveProperty('users')
      expect(result.data).toHaveProperty('pagination')
    })

    it('should handle network errors', async () => {
      mock.onGet('/api/users?page=1&limit=10').networkError()

      await expect(userService.getUsers(1, 10)).rejects.toThrow()
    })

    it('should handle API errors', async () => {
      mock.onGet('/api/users?page=1&limit=10').reply(500, {
        message: 'Internal server error'
      })

      await expect(userService.getUsers(1, 10)).rejects.toThrow()
    })
  })

  describe('getUser', () => {
    it('should fetch single user by id', async () => {
      const mockUser = createMockUser({ id: 1 })
      const mockResponse = {
        data: { user: mockUser },
        message: 'User found',
        status: 'success'
      }

      mock.onGet('/api/users/1').reply(200, mockResponse)

      const result = await userService.getUser(1)

      expect(result.data.user.id).toBe(1)
      expect(result.data.user.username).toBe(mockUser.username)
    })

    it('should handle user not found', async () => {
      mock.onGet('/api/users/999').reply(404, {
        message: 'User not found'
      })

      await expect(userService.getUser(999)).rejects.toThrow()
    })
  })

  describe('createUser', () => {
    it('should create a new user with correct payload', async () => {
      const userData: CreateUserData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        is_active: true,
        role_ids: [1, 2],
        force_two_factor: false
      }

      const mockResponse = {
        data: {
          user: {
            id: 100,
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        message: 'User created',
        status: 'success'
      }

      mock.onPost('/api/users').reply(200, mockResponse)

      const result = await userService.createUser(userData)

      expect(result.data.user.username).toBe('newuser')
      expect(result.data.user.email).toBe('new@example.com')
    })

    it('should send role_ids in correct format', async () => {
      const userData: CreateUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'pass123',
        is_active: true,
        role_ids: [1, 2, 3],
        force_two_factor: true
      }

      mock.onPost('/api/users').reply((config) => {
        const data = JSON.parse(config.data)
        
        // Verify role_ids is sent as array
        expect(data.role_ids).toEqual([1, 2, 3])
        expect(data.force_two_factor).toBe(true)
        
        return [200, { data: { user: { id: 1, ...data } } }]
      })

      await userService.createUser(userData)
    })

    it('should handle validation errors', async () => {
      const userData: CreateUserData = {
        username: '',
        email: 'invalid',
        password: '123',
        is_active: true,
        role_ids: [],
        force_two_factor: false
      }

      mock.onPost('/api/users').reply(400, {
        message: 'Validation failed',
        errors: {
          username: 'Username is required',
          email: 'Invalid email format',
          password: 'Password too short',
          role_ids: 'At least one role required'
        }
      })

      await expect(userService.createUser(userData)).rejects.toThrow()
    })

    it('should handle duplicate username error', async () => {
      const userData: CreateUserData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'pass123',
        is_active: true,
        role_ids: [1],
        force_two_factor: false
      }

      mock.onPost('/api/users').reply(409, {
        message: 'Username already exists'
      })

      await expect(userService.createUser(userData)).rejects.toThrow()
    })
  })

  describe('updateUser', () => {
    it('should update user with correct payload', async () => {
      const userData: UpdateUserData = {
        username: 'updateduser',
        email: 'updated@example.com',
        is_active: false,
        role_ids: [2, 3],
        force_two_factor: true
      }

      const mockResponse = {
        data: {
          user: {
            id: 1,
            ...userData,
            updated_at: new Date().toISOString()
          }
        },
        message: 'User updated',
        status: 'success'
      }

      mock.onPut('/api/users/1').reply(200, mockResponse)

      const result = await userService.updateUser(1, userData)

      expect(result.data.user.username).toBe('updateduser')
      expect(result.data.user.is_active).toBe(false)
    })

    it('should update user without password', async () => {
      const userData: UpdateUserData = {
        username: 'updateduser',
        email: 'updated@example.com',
        is_active: true,
        role_ids: [1]
      }

      mock.onPut('/api/users/1').reply((config) => {
        const data = JSON.parse(config.data)
        
        // Verify password is not included
        expect(data.password).toBeUndefined()
        
        return [200, { data: { user: { id: 1, ...data } } }]
      })

      await userService.updateUser(1, userData)
    })

    it('should include password when provided', async () => {
      const userData: UpdateUserData = {
        username: 'updateduser',
        email: 'updated@example.com',
        password: 'newpassword123',
        is_active: true,
        role_ids: [1]
      }

      mock.onPut('/api/users/1').reply((config) => {
        const data = JSON.parse(config.data)
        
        // Verify password is included
        expect(data.password).toBe('newpassword123')
        
        return [200, { data: { user: { id: 1, ...data } } }]
      })

      await userService.updateUser(1, userData)
    })

    it('should handle update of non-existent user', async () => {
      const userData: UpdateUserData = {
        username: 'test',
        email: 'test@example.com',
        is_active: true,
        role_ids: [1]
      }

      mock.onPut('/api/users/999').reply(404, {
        message: 'User not found'
      })

      await expect(userService.updateUser(999, userData)).rejects.toThrow()
    })
  })

  describe('deleteUser', () => {
    it('should delete user by id', async () => {
      mock.onDelete('/api/users/1').reply(200, {
        message: 'User deleted successfully'
      })

      await expect(userService.deleteUser(1)).resolves.not.toThrow()
    })

    it('should handle deletion of non-existent user', async () => {
      mock.onDelete('/api/users/999').reply(404, {
        message: 'User not found'
      })

      await expect(userService.deleteUser(999)).rejects.toThrow()
    })

    it('should handle deletion errors', async () => {
      mock.onDelete('/api/users/1').reply(500, {
        message: 'Cannot delete user with active sessions'
      })

      await expect(userService.deleteUser(1)).rejects.toThrow()
    })
  })

  describe('toggleUserStatus', () => {
    it('should toggle user status', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 1,
            is_active: false
          }
        },
        message: 'Status toggled'
      }

      mock.onPost('/api/users/1/toggle-status').reply(200, mockResponse)

      const result = await userService.toggleUserStatus(1)

      expect(result.data.user.is_active).toBe(false)
    })

    it('should handle toggle status errors', async () => {
      mock.onPost('/api/users/999/toggle-status').reply(404, {
        message: 'User not found'
      })

      await expect(userService.toggleUserStatus(999)).rejects.toThrow()
    })
  })

  describe('getRoles', () => {
    it('should fetch all roles', async () => {
      const mockRoles = [
        createMockRole({ id: 1, name: 'Admin' }),
        createMockRole({ id: 2, name: 'Editor' }),
        createMockRole({ id: 3, name: 'Viewer' })
      ]

      mock.onGet('/api/roles').reply(200, {
        data: { roles: mockRoles }
      })

      const result = await userService.getRoles()

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Admin')
    })

    it('should handle empty roles list', async () => {
      mock.onGet('/api/roles').reply(200, {
        data: { roles: [] }
      })

      const result = await userService.getRoles()

      expect(result).toHaveLength(0)
    })

    it('should normalize different response formats', async () => {
      // Test when roles are returned directly
      mock.onGet('/api/roles').reply(200, [
        createMockRole({ id: 1, name: 'Admin' })
      ])

      const result = await userService.getRoles()

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getCurrentUser', () => {
    it('should fetch current authenticated user', async () => {
      const mockUser = createMockUser({
        id: 1,
        username: 'currentuser'
      })

      mock.onGet('/api/users/me').reply(200, {
        data: { user: mockUser }
      })

      const result = await userService.getCurrentUser()

      expect(result.data.user.username).toBe('currentuser')
    })

    it('should handle unauthenticated requests', async () => {
      mock.onGet('/api/users/me').reply(401, {
        message: 'Unauthorized'
      })

      await expect(userService.getCurrentUser()).rejects.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed JSON responses', async () => {
      mock.onGet('/api/users?page=1&limit=10').reply(200, 'invalid json')

      await expect(userService.getUsers(1, 10)).rejects.toThrow()
    })

    it('should handle timeout errors', async () => {
      mock.onGet('/api/users?page=1&limit=10').timeout()

      await expect(userService.getUsers(1, 10)).rejects.toThrow()
    })

    it('should handle very large user lists', async () => {
      const largeUserList = createMockUsers(1000)
      const mockResponse = {
        data: {
          users: largeUserList,
          pagination: { limit: 1000, page: 1, pages: 1, total: 1000 }
        }
      }

      mock.onGet('/api/users?page=1&limit=1000').reply(200, mockResponse)

      const result = await userService.getUsers(1, 1000)

      expect(result.data.users).toHaveLength(1000)
    })

    it('should handle special characters in usernames', async () => {
      const userData: CreateUserData = {
        username: 'user@#$%',
        email: 'special@example.com',
        password: 'pass123',
        is_active: true,
        role_ids: [1],
        force_two_factor: false
      }

      mock.onPost('/api/users').reply(200, {
        data: { user: { id: 1, ...userData } }
      })

      const result = await userService.createUser(userData)

      expect(result.data.user.username).toBe('user@#$%')
    })
  })
})
