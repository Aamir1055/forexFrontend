import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { User, Role, CreateUserData, UpdateUserData } from '../services/userService'

interface UserModalProps {
  user?: User | null
  roles: Role[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateUserData | UpdateUserData) => void
  isLoading: boolean
}

const UserModal: React.FC<UserModalProps> = ({
  user,
  roles,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    is_active: true,
    role_ids: [],
    force_two_factor: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        is_active: user.is_active,
        role_ids: user.roles.map(role => role.id),
        force_two_factor: user.force_two_factor || false
      })
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        is_active: true,
        role_ids: [],
        force_two_factor: false
      })
    }
    setErrors({})
  }, [user, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRoleChange = (roleId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      role_ids: checked 
        ? [...prev.role_ids, roleId]
        : prev.role_ids.filter(id => id !== roleId)
    }))
    
    if (errors.role_ids) {
      setErrors(prev => ({ ...prev, role_ids: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.role_ids.length === 0) {
      newErrors.role_ids = 'At least one role must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData = user 
      ? {
          username: formData.username,
          email: formData.email,
          is_active: formData.is_active,
          role_ids: formData.role_ids,
          ...(formData.password && { password: formData.password })
        }
      : formData

    onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(4px)' }}>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={onClose} 
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-lg shadow-xl transform w-full max-w-2xl mx-4 overflow-hidden"
          >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {user ? 'Edit User' : 'Create New User'}
                    </h3>
                    <p className="text-slate-600 text-xs mt-1">
                      {user ? 'Update user information and permissions' : 'Add a new user to the system'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-all duration-200"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-4 py-4">
                <div className="space-y-4">
                  {/* Basic Information Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 pb-1 border-b border-slate-200">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Username */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full px-2.5 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors.username ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter username"
                        />
                        {errors.username && (
                          <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-2.5 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter email address"
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Password {user && <span className="text-slate-500 font-normal">(leave blank to keep current)</span>}
                      </label>
                      <div className="max-w-xs">
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-2.5 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
                        />
                        {errors.password && (
                          <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Roles & Permissions Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 pb-1 border-b border-slate-200">
                      Roles & Permissions
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className="flex items-center cursor-pointer p-2 border border-slate-200 rounded hover:bg-slate-50 hover:border-blue-300 transition-all duration-200"
                        >
                          <input
                            type="checkbox"
                            checked={formData.role_ids.includes(role.id)}
                            onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                          />
                          <span className="ml-2 text-xs font-medium text-slate-700">{role.name}</span>
                        </label>
                      ))}
                    </div>
                    {errors.role_ids && (
                      <p className="mt-1 text-xs text-red-600">{errors.role_ids}</p>
                    )}
                  </div>

                  {/* Status Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 pb-1 border-b border-slate-200">
                      Account Status
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                        />
                        <div className="ml-2">
                          <span className="text-xs font-medium text-slate-700">User is active</span>
                          <p className="text-xs text-slate-500">Active users can log in and access the system</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center cursor-pointer p-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          name="force_two_factor"
                          checked={formData.force_two_factor}
                          onChange={handleInputChange}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                        />
                        <div className="ml-2">
                          <span className="text-xs font-medium text-slate-700">Force Two-Factor Authentication</span>
                          <p className="text-xs text-slate-500">User must set up 2FA on first login</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </form>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <div className="text-xs text-slate-600">
                  {user ? 'Changes will be saved immediately' : 'User will receive login credentials via email'}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-500 transition-all duration-200"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {user ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      user ? 'Update User' : 'Create User'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default UserModal