import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockUser, createMockRole } from '../utils/test-utils'
import UserModal from '../../components/UserModal'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('UserModal Component', () => {
  const mockRoles = [
    createMockRole({ id: 1, name: 'Admin' }),
    createMockRole({ id: 2, name: 'Editor' }),
    createMockRole({ id: 3, name: 'Viewer' }),
  ]

  const mockOnClose = jest.fn()
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create user form with all required fields', () => {
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      expect(screen.getByText('Create New User')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
      expect(screen.getByText('Create User')).toBeInTheDocument()
    })

    it('should display all available roles as checkboxes', () => {
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      mockRoles.forEach(role => {
        expect(screen.getByText(role.name)).toBeInTheDocument()
      })
    })

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Try to submit without filling fields
      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
        expect(screen.getByText(/at least one role must be selected/i)).toBeInTheDocument()
      })

      // Should not call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      const emailInput = screen.getByPlaceholderText('Enter email address')
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('should validate password minimum length', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      const passwordInput = screen.getByPlaceholderText('Enter password')
      await user.type(passwordInput, '123')

      const submitButton = screen.getByText('Create User')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should successfully submit valid create user form', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Fill in all required fields
      await user.type(screen.getByPlaceholderText('Enter username'), 'newuser')
      await user.type(screen.getByPlaceholderText('Enter email address'), 'newuser@example.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123')

      // Select at least one role
      const adminCheckbox = screen.getByRole('checkbox', { name: /admin/i })
      await user.click(adminCheckbox)

      // Submit form
      await user.click(screen.getByText('Create User'))

      // Should call onSubmit with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          is_active: true,
          role_ids: [1],
          force_two_factor: false
        })
      })
    })

    it('should handle multiple role selection', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter username'), 'multiuser')
      await user.type(screen.getByPlaceholderText('Enter email address'), 'multi@example.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123')

      // Select multiple roles
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))
      await user.click(screen.getByRole('checkbox', { name: /editor/i }))

      await user.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            role_ids: [1, 2]
          })
        )
      })
    })

    it('should toggle is_active checkbox', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter username'), 'inactiveuser')
      await user.type(screen.getByPlaceholderText('Enter email address'), 'inactive@example.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123')
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))

      // Toggle is_active checkbox
      const activeCheckbox = screen.getByRole('checkbox', { name: /user is active/i })
      await user.click(activeCheckbox)

      await user.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            is_active: false
          })
        )
      })
    })

    it('should toggle force_two_factor checkbox', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Fill required fields
      await user.type(screen.getByPlaceholderText('Enter username'), '2fauser')
      await user.type(screen.getByPlaceholderText('Enter email address'), '2fa@example.com')
      await user.type(screen.getByPlaceholderText('Enter password'), 'password123')
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))

      // Toggle force 2FA checkbox
      const force2FACheckbox = screen.getByRole('checkbox', { name: /force 2fa/i })
      await user.click(force2FACheckbox)

      await user.click(screen.getByText('Create User'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            force_two_factor: true
          })
        )
      })
    })
  })

  describe('Edit Mode', () => {
    const existingUser = createMockUser({
      id: 1,
      username: 'existinguser',
      email: 'existing@example.com',
      is_active: true,
      force_two_factor: false,
      roles: [mockRoles[0], mockRoles[1]]
    })

    it('should render edit user form with existing user data', () => {
      render(
        <UserModal
          user={existingUser}
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      expect(screen.getByText('Edit User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('existinguser')).toBeInTheDocument()
      expect(screen.getByDisplayValue('existing@example.com')).toBeInTheDocument()
      expect(screen.getByText('Update User')).toBeInTheDocument()
    })

    it('should pre-select existing user roles', () => {
      render(
        <UserModal
          user={existingUser}
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      const adminCheckbox = screen.getByRole('checkbox', { name: /admin/i })
      const editorCheckbox = screen.getByRole('checkbox', { name: /editor/i })
      const viewerCheckbox = screen.getByRole('checkbox', { name: /viewer/i })

      expect(adminCheckbox).toBeChecked()
      expect(editorCheckbox).toBeChecked()
      expect(viewerCheckbox).not.toBeChecked()
    })

    it('should not require password in edit mode', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          user={existingUser}
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Submit without changing password
      await user.click(screen.getByText('Update User'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'existinguser',
            email: 'existing@example.com'
          })
        )
      })

      // Should not include password field
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.anything()
        })
      )
    })

    it('should include password if provided in edit mode', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          user={existingUser}
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Enter new password
      const passwordInput = screen.getByPlaceholderText('Leave blank to keep current')
      await user.type(passwordInput, 'newpassword123')

      await user.click(screen.getByText('Update User'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            password: 'newpassword123'
          })
        )
      })
    })

    it('should allow changing user roles', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          user={existingUser}
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Uncheck Admin, add Viewer
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))
      await user.click(screen.getByRole('checkbox', { name: /viewer/i }))

      await user.click(screen.getByText('Update User'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            role_ids: [2, 3] // Editor and Viewer
          })
        )
      })
    })

    it('should still require at least one role in edit mode', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          user={existingUser}
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Uncheck all roles
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))
      await user.click(screen.getByRole('checkbox', { name: /editor/i }))

      await user.click(screen.getByText('Update User'))

      await waitFor(() => {
        expect(screen.getByText(/at least one role must be selected/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should display loading indicator when isLoading is true', () => {
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      )

      expect(screen.getByText(/creating.../i)).toBeInTheDocument()
    })

    it('should disable submit button when loading', () => {
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /creating/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Modal Controls', () => {
    it('should call onClose when clicking cancel button', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      await user.click(screen.getByText('Cancel'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when clicking X button', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      const closeButton = screen.getByRole('button', { name: '' })
      await user.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      const { container } = render(
        <UserModal
          isOpen={false}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('Error Clearing', () => {
    it('should clear error when user starts typing in field', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Trigger validation error
      await user.click(screen.getByText('Create User'))
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()

      // Start typing
      await user.type(screen.getByPlaceholderText('Enter username'), 'test')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument()
      })
    })

    it('should clear role error when selecting a role', async () => {
      const user = userEvent.setup()
      
      render(
        <UserModal
          isOpen={true}
          roles={mockRoles}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      )

      // Trigger validation error
      await user.click(screen.getByText('Create User'))
      expect(screen.getByText(/at least one role must be selected/i)).toBeInTheDocument()

      // Select a role
      await user.click(screen.getByRole('checkbox', { name: /admin/i }))

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/at least one role must be selected/i)).not.toBeInTheDocument()
      })
    })
  })
})
