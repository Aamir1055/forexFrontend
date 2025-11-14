import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { render, createMockUsers, createMockUsersResponse, createMockRole, mockToast } from '../utils/test-utils'
import Users from '../../pages/Users'

// Mock API responses
const mockUsers = createMockUsers(15)
const mockRoles = [
  createMockRole({ id: 1, name: 'Admin' }),
  createMockRole({ id: 2, name: 'Editor' }),
  createMockRole({ id: 3, name: 'Viewer' }),
]

// Setup MSW server
const server = setupServer(
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 10
    const start = (page - 1) * limit
    const end = start + limit
    
    return HttpResponse.json(
      createMockUsersResponse(mockUsers.slice(start, end), page, limit)
    )
  }),
  http.get('/api/roles', () => {
    return HttpResponse.json({ data: { roles: mockRoles } })
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: { user: { id: 99, ...body } },
      message: 'User created successfully',
      status: 'success'
    })
  }),
  http.put('/api/users/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      data: { user: { id: Number(params.id), ...body } },
      message: 'User updated successfully',
      status: 'success'
    })
  }),
  http.delete('/api/users/:id', () => {
    return HttpResponse.json({ message: 'User deleted successfully' })
  }),
  http.post('/api/users/:id/toggle-status', ({ params }) => {
    return HttpResponse.json({
      data: { user: { id: Number(params.id), is_active: true } },
      message: 'Status updated'
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
})
afterAll(() => server.close())

describe('Users Page - Integration Tests', () => {
  describe('Initial Load', () => {
    it('should load and display users on mount', async () => {
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      // Should display first 10 users
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`user${i}`)).toBeInTheDocument()
      }
    })

    it('should display total user count in header', async () => {
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText(/15 users/i)).toBeInTheDocument()
      })
    })

    it('should show active and inactive user counts', async () => {
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter users by username', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'user1')

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
        expect(screen.queryByText('user2')).not.toBeInTheDocument()
      })
    })

    it('should filter users by email', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'user3@')

      await waitFor(() => {
        expect(screen.getByText('user3@example.com')).toBeInTheDocument()
        expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument()
      })
    })

    it('should clear search when clicking X button', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'user1')

      await waitFor(() => {
        expect(screen.queryByText('user2')).not.toBeInTheDocument()
      })

      const clearButton = screen.getByRole('button', { name: '' })
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText('user2')).toBeInTheDocument()
      })
    })

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search users/i)
      await user.type(searchInput, 'nonexistentuser')

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
      })
    })
  })

  describe('Role Filtering', () => {
    it('should filter users by selected role', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const roleSelect = screen.getByRole('combobox')
      await user.selectOptions(roleSelect, 'Admin')

      await waitFor(() => {
        // Only Admin users should be visible
        const adminUsers = mockUsers.filter(u => u.roles[0].name === 'Admin')
        adminUsers.forEach(u => {
          if (u.username.startsWith('user')) {
            expect(screen.getByText(u.username)).toBeInTheDocument()
          }
        })
      })
    })

    it('should show all users when "All Roles" is selected', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const roleSelect = screen.getByRole('combobox')
      await user.selectOptions(roleSelect, 'Admin')
      await user.selectOptions(roleSelect, 'all')

      await waitFor(() => {
        for (let i = 1; i <= 10; i++) {
          expect(screen.getByText(`user${i}`)).toBeInTheDocument()
        }
      })
    })
  })

  describe('Create User Workflow', () => {
    it('should open modal when clicking Add User button', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add User'))

      await waitFor(() => {
        expect(screen.getByText('Create New User')).toBeInTheDocument()
      })
    })

    it('should successfully create a new user', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument()
      })

      // Open modal
      await user.click(screen.getByText('Add User'))

      await waitFor(() => {
        expect(screen.getByText('Create New User')).toBeInTheDocument()
      })

      // Fill form
      await user.type(screen.getByPlaceholderText('Enter username'), 'newuser')
      await user.type(screen.getByPlaceholderText('Enter email address'), 'newuser@test.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123')
      
      // Select a role
      const adminCheckbox = screen.getByRole('checkbox', { name: /admin/i })
      await user.click(adminCheckbox)

      // Submit
      await user.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('User created successfully!')
      })
    })

    it('should close modal after successful creation', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add User'))
      
      await waitFor(() => {
        expect(screen.getByText('Create New User')).toBeInTheDocument()
      })

      // Fill and submit form
      await user.type(screen.getByPlaceholderText('Enter username'), 'newuser')
      await user.type(screen.getByPlaceholderText('Enter email address'), 'newuser@test.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123')
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))
      await user.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(screen.queryByText('Create New User')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edit User Workflow', () => {
    it('should open modal with user data when clicking edit', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle('Edit user')
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
        expect(screen.getByDisplayValue('user1')).toBeInTheDocument()
      })
    })

    it('should successfully update a user', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      // Open edit modal
      const editButtons = screen.getAllByTitle('Edit user')
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument()
      })

      // Update username
      const usernameInput = screen.getByDisplayValue('user1')
      await user.clear(usernameInput)
      await user.type(usernameInput, 'updateduser')

      // Submit
      await user.click(screen.getByText('Update User'))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('User updated successfully!')
      })
    })
  })

  describe('Delete User Workflow', () => {
    it('should show confirmation dialog when clicking delete', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete user')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument()
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })
    })

    it('should successfully delete user after confirmation', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      // Click delete
      const deleteButtons = screen.getAllByTitle('Delete user')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument()
      })

      // Confirm deletion
      await user.click(screen.getByText('Delete User'))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('User deleted successfully!')
      })
    })

    it('should cancel deletion when clicking cancel', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete user')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument()
      })

      // Cancel
      await user.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Status Toggle', () => {
    it('should toggle user status', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const toggles = screen.getAllByRole('checkbox')
      await user.click(toggles[0])

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('User status updated successfully!')
      })
    })
  })

  describe('Pagination', () => {
    it('should change items per page', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      const itemsPerPageSelect = screen.getAllByRole('combobox')[1] // Second combobox
      await user.selectOptions(itemsPerPageSelect, '5')

      await waitFor(() => {
        // Should only show 5 users
        expect(screen.getByText('user5')).toBeInTheDocument()
        expect(screen.queryByText('user6')).not.toBeInTheDocument()
      })
    })

    it('should navigate to next page', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      // Find and click next button
      const nextButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg')
      )
      
      await user.click(nextButtons[nextButtons.length - 1])

      await waitFor(() => {
        expect(screen.getByText(/page 2/i)).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('should refresh user list when clicking refresh button', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Refresh'))

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Users list refreshed!')
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when API call fails', async () => {
      server.use(
        http.get('/api/users', () => {
          return HttpResponse.json({ message: 'Server error' }, { status: 500 })
        })
      )

      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Users')).toBeInTheDocument()
      })
    })

    it('should show access denied message for 403 error', async () => {
      server.use(
        http.get('/api/users', () => {
          return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        })
      )

      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
      })
    })

    it('should show error toast when create fails', async () => {
      server.use(
        http.post('/api/users', () => {
          return HttpResponse.json(
            { message: 'Username already exists' },
            { status: 400 }
          )
        })
      )

      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Add User'))
      
      await waitFor(() => {
        expect(screen.getByText('Create New User')).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText('Enter username'), 'duplicate')
      await user.type(screen.getByPlaceholderText('Enter email address'), 'dup@test.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'pass123')
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))
      await user.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Username already exists')
      })
    })
  })

  describe('Sorting', () => {
    it('should sort users when clicking column headers', async () => {
      const user = userEvent.setup()
      render(<Users />)

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument()
      })

      // Click username header to sort
      await user.click(screen.getByText('User'))

      // Visual indicator should show sort direction
      await waitFor(() => {
        expect(screen.getByText('↑')).toBeInTheDocument()
      })
    })
  })
})
