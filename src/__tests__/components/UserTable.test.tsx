import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockUsers, createMockUser, createMockPermissionContext } from '../utils/test-utils'
import UserTable from '../../components/UserTable'

describe('UserTable Component', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnToggleStatus = jest.fn()
  const mockOnSort = jest.fn()
  const mockOnPageChange = jest.fn()

  const defaultProps = {
    users: createMockUsers(5),
    isLoading: false,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onToggleStatus: mockOnToggleStatus,
    onSort: mockOnSort,
    currentSort: { field: 'created_at', order: 'DESC' as const },
    currentPage: 1,
    onPageChange: mockOnPageChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render table with user data', () => {
      render(<UserTable {...defaultProps} />)

      // Check if table headers are present
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Roles')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should display all users in the table', () => {
      render(<UserTable {...defaultProps} />)

      defaultProps.users.forEach(user => {
        expect(screen.getByText(user.username)).toBeInTheDocument()
        expect(screen.getByText(user.email)).toBeInTheDocument()
      })
    })

    it('should display user roles', () => {
      const users = [
        createMockUser({ id: 1, username: 'admin', roles: [{ id: 1, name: 'Admin', description: '', created_at: '', updated_at: '' }] }),
        createMockUser({ id: 2, username: 'editor', roles: [{ id: 2, name: 'Editor', description: '', created_at: '', updated_at: '' }] }),
      ]

      render(<UserTable {...defaultProps} users={users} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Editor')).toBeInTheDocument()
    })

    it('should show +N indicator for users with more than 2 roles', () => {
      const multiRoleUser = createMockUser({
        id: 1,
        username: 'multirole',
        roles: [
          { id: 1, name: 'Admin', description: '', created_at: '', updated_at: '' },
          { id: 2, name: 'Editor', description: '', created_at: '', updated_at: '' },
          { id: 3, name: 'Viewer', description: '', created_at: '', updated_at: '' },
        ]
      })

      render(<UserTable {...defaultProps} users={[multiRoleUser]} />)

      expect(screen.getByText('+1')).toBeInTheDocument()
    })

    it('should display avatar for each user', () => {
      render(<UserTable {...defaultProps} />)

      const avatars = screen.getAllByRole('img', { name: 'Avatar' })
      expect(avatars).toHaveLength(defaultProps.users.length)
    })

    it('should display formatted creation date', () => {
      const user = createMockUser({
        created_at: '2024-01-15T10:30:00.000Z'
      })

      render(<UserTable {...defaultProps} users={[user]} />)

      // Date should be formatted
      expect(screen.getByText(/Jan/)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<UserTable {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Loading users...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we fetch the data')).toBeInTheDocument()
    })

    it('should not render table when loading', () => {
      render(<UserTable {...defaultProps} isLoading={true} />)

      expect(screen.queryByText('User')).not.toBeInTheDocument()
      expect(screen.queryByText('Email')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state message when no users', () => {
      render(<UserTable {...defaultProps} users={[]} />)

      expect(screen.getByText('No users found')).toBeInTheDocument()
      expect(screen.getByText('Get started by creating your first user or adjust your filters.')).toBeInTheDocument()
    })

    it('should not render table when no users', () => {
      render(<UserTable {...defaultProps} users={[]} />)

      expect(screen.queryByText('User')).not.toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should display sort indicator for current sort field', () => {
      render(<UserTable {...defaultProps} currentSort={{ field: 'username', order: 'ASC' }} />)

      // Should show up arrow for ASC
      expect(screen.getByText('↑')).toBeInTheDocument()
    })

    it('should call onSort when clicking sortable column', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} />)

      await user.click(screen.getByText('User'))

      expect(mockOnSort).toHaveBeenCalledWith('username')
    })

    it('should be able to sort by different columns', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} />)

      await user.click(screen.getByText('Email'))
      expect(mockOnSort).toHaveBeenCalledWith('email')

      await user.click(screen.getByText('Status'))
      expect(mockOnSort).toHaveBeenCalledWith('is_active')

      await user.click(screen.getByText('Created'))
      expect(mockOnSort).toHaveBeenCalledWith('created_at')
    })
  })

  describe('User Actions', () => {
    it('should call onEdit when clicking edit button', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} />)

      const editButtons = screen.getAllByTitle('Edit user')
      await user.click(editButtons[0])

      expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.users[0])
    })

    it('should call onDelete when clicking delete button', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} />)

      const deleteButtons = screen.getAllByTitle('Delete user')
      await user.click(deleteButtons[0])

      expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.users[0].id)
    })

    it('should call onToggleStatus when clicking status toggle', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} />)

      const toggles = screen.getAllByRole('checkbox')
      await user.click(toggles[0])

      expect(mockOnToggleStatus).toHaveBeenCalledWith(defaultProps.users[0].id)
    })
  })

  describe('Permission Gates', () => {
    it('should hide edit button when user lacks edit permission', () => {
      const noEditPermissions = createMockPermissionContext({
        permissions: ['users.view', 'users.delete'],
        hasPermission: jest.fn((permission: string) => permission !== 'users.edit')
      })

      render(
        <UserTable {...defaultProps} />,
        { permissionValue: noEditPermissions }
      )

      expect(screen.queryByTitle('Edit user')).not.toBeInTheDocument()
    })

    it('should hide delete button when user lacks delete permission', () => {
      const noDeletePermissions = createMockPermissionContext({
        permissions: ['users.view', 'users.edit'],
        hasPermission: jest.fn((permission: string) => permission !== 'users.delete')
      })

      render(
        <UserTable {...defaultProps} />,
        { permissionValue: noDeletePermissions }
      )

      expect(screen.queryByTitle('Delete user')).not.toBeInTheDocument()
    })

    it('should show static status badge instead of toggle when lacking edit permission', () => {
      const noEditPermissions = createMockPermissionContext({
        permissions: ['users.view'],
        hasPermission: jest.fn(() => false)
      })

      render(
        <UserTable {...defaultProps} />,
        { permissionValue: noEditPermissions }
      )

      // Should show badges instead of toggles
      expect(screen.getByText('Active')).toBeInTheDocument()
      // Toggles should not be present
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    const paginationInfo = {
      limit: 10,
      page: 1,
      pages: 3,
      total: 25
    }

    it('should display pagination info when provided', () => {
      render(<UserTable {...defaultProps} pagination={paginationInfo} />)

      expect(screen.getByText(/showing/i)).toBeInTheDocument()
      expect(screen.getByText(/1/)).toBeInTheDocument()
      expect(screen.getByText(/25/)).toBeInTheDocument()
    })

    it('should call onPageChange when clicking next button', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} pagination={paginationInfo} />)

      await user.click(screen.getByText('Next'))
      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange when clicking previous button', async () => {
      const user = userEvent.setup()
      render(<UserTable {...defaultProps} pagination={paginationInfo} currentPage={2} />)

      await user.click(screen.getByText('Previous'))
      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('should disable previous button on first page', () => {
      render(<UserTable {...defaultProps} pagination={paginationInfo} currentPage={1} />)

      const prevButton = screen.getByText('Previous')
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      render(<UserTable {...defaultProps} pagination={paginationInfo} currentPage={3} />)

      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should not show pagination when only one page', () => {
      const singlePageInfo = { ...paginationInfo, pages: 1 }
      render(<UserTable {...defaultProps} pagination={singlePageInfo} />)

      expect(screen.queryByText('Previous')).not.toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })
  })

  describe('User Status Display', () => {
    it('should show green indicator for active users', () => {
      const activeUser = createMockUser({ is_active: true })
      render(<UserTable {...defaultProps} users={[activeUser]} />)

      const toggle = screen.getByRole('checkbox')
      expect(toggle).toBeChecked()
    })

    it('should show correct status for inactive users', () => {
      const inactiveUser = createMockUser({ is_active: false })
      render(<UserTable {...defaultProps} users={[inactiveUser]} />)

      const toggle = screen.getByRole('checkbox')
      expect(toggle).not.toBeChecked()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user with no roles', () => {
      const userWithoutRoles = createMockUser({ roles: [] })
      render(<UserTable {...defaultProps} users={[userWithoutRoles]} />)

      // Should not crash
      expect(screen.getByText(userWithoutRoles.username)).toBeInTheDocument()
    })

    it('should handle very long usernames gracefully', () => {
      const longNameUser = createMockUser({ username: 'A'.repeat(100) })
      render(<UserTable {...defaultProps} users={[longNameUser]} />)

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })

    it('should handle very long email addresses', () => {
      const longEmailUser = createMockUser({ email: 'verylongemailaddress@verylongdomainname.com' })
      render(<UserTable {...defaultProps} users={[longEmailUser]} />)

      expect(screen.getByText('verylongemailaddress@verylongdomainname.com')).toBeInTheDocument()
    })

    it('should handle invalid dates gracefully', () => {
      const invalidDateUser = createMockUser({ created_at: 'invalid-date' })
      
      // Should not throw error
      expect(() => {
        render(<UserTable {...defaultProps} users={[invalidDateUser]} />)
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<UserTable {...defaultProps} />)

      expect(screen.getAllByTitle('Edit user')).toHaveLength(defaultProps.users.length)
      expect(screen.getAllByTitle('Delete user')).toHaveLength(defaultProps.users.length)
    })

    it('should use proper table semantics', () => {
      const { container } = render(<UserTable {...defaultProps} />)

      expect(container.querySelector('table')).toBeInTheDocument()
      expect(container.querySelector('thead')).toBeInTheDocument()
      expect(container.querySelector('tbody')).toBeInTheDocument()
    })
  })
})
