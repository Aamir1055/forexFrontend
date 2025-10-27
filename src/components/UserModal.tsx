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
    console.log('📝 UserModal - useEffect triggered')
    console.log('📝 UserModal - User data:', user)
    console.log('📝 UserModal - Is open:', isOpen)
    
    if (user) {
      const roleIds = user.roles.map(role => role.id)
      console.log('📝 UserModal - Extracted role IDs:', roleIds)
      console.log('📝 UserModal - User roles:', user.roles)
      
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        is_active: user.is_active,
        role_ids: roleIds,
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
          roles: formData.role_ids,  // Backend expects "roles" not "role_ids"
          force_two_factor: formData.force_two_factor,
          ...(formData.password && { password: formData.password })
        }
      : {
          ...formData,
          roles: formData.role_ids  // Backend expects "roles" not "role_ids"
        }

    console.log('🔧 UserModal - Submitting data:', submitData)
    console.log('🔧 UserModal - Role IDs:', formData.role_ids)
    console.log('🔧 UserModal - Is editing:', !!user)
    
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
            className="relative bg-white rounded-xl shadow-2xl transform w-full max-w-2xl mx-4 overflow-hidden"
          >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {user ? 'Edit User' : 'Create New User'}
                    </h3>
                    <p className="text-slate-600 text-xs mt-0.5">
                      {user ? 'Update user information and permissions' : 'Add a new user to the system'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white/70 transition-all duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-5 py-4">
                <div className="space-y-4">
                  {/* Basic Information Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2.5 pb-1.5 border-b border-slate-200 uppercase tracking-wide flex items-center">
                      <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mr-2">1</span>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Username */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors.username ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter username"
                        />
                        {errors.username && (
                          <p className="mt-1 text-[11px] text-red-600">{errors.username}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter email address"
                        />
                        {errors.email && (
                          <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mt-2.5">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Password {user ? <span className="text-slate-500 font-normal text-[11px]">(leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                      </label>
                      <div className="max-w-md">
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
                        />
                        {errors.password && (
                          <p className="mt-1 text-[11px] text-red-600">{errors.password}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Roles & Permissions Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2.5 pb-1.5 border-b border-slate-200 uppercase tracking-wide flex items-center">
                      <span className="w-5 h-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold mr-2">2</span>
                      Roles & Permissions <span className="text-red-500 ml-1">*</span>
                    </h4>
                    <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-2.5 rounded-lg ${
                      errors.role_ids ? 'border-2 border-red-300 bg-red-50' : 'border border-slate-200 bg-slate-50'
                    }`}>
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className={`flex items-center cursor-pointer px-2.5 py-1.5 border rounded-lg hover:bg-white transition-all duration-200 ${
                            formData.role_ids.includes(role.id) 
                              ? 'border-blue-400 bg-blue-50 shadow-sm' 
                              : 'border-slate-200 bg-white hover:border-blue-300'
                          }`}
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
                      <p className="mt-2 text-[11px] text-red-600 font-medium flex items-center gap-1">
                        <span>⚠️</span> {errors.role_ids}
                      </p>
                    )}
                    {formData.role_ids.length === 0 && !errors.role_ids && (
                      <p className="mt-2 text-[11px] text-amber-600 flex items-center gap-1">
                        <span>💡</span> Select at least one role for the user
                      </p>
                    )}
                  </div>

                  {/* Status Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2.5 pb-1.5 border-b border-slate-200 uppercase tracking-wide flex items-center">
                      <span className="w-5 h-5 rounded bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold mr-2">3</span>
                      Account Settings
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-start cursor-pointer p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-green-600 focus:ring-green-500 transition-colors duration-200"
                        />
                        <div className="ml-2.5">
                          <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">User is active</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">Active users can log in and access the system</p>
                        </div>
                      </label>
                      
                      <label className="flex items-start cursor-pointer p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                        <input
                          type="checkbox"
                          name="force_two_factor"
                          checked={formData.force_two_factor}
                          onChange={handleInputChange}
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 transition-colors duration-200"
                        />
                        <div className="ml-2.5">
                          <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 flex items-center gap-1">
                            Force Two-Factor Authentication <span className="text-orange-600">🔥</span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">User must set up 2FA on first login</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </form>

              {/* Actions */}
              <div className="px-5 py-3.5 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 flex justify-between items-center">
                <div className="text-[11px] text-slate-600">
                  {user ? '✨ Changes will be saved immediately' : '📧 User will receive login credentials'}
                </div>
                <div className="flex space-x-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all duration-200"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <span className="flex items-center gap-1.5">
                        {user ? '💾 Update User' : '✨ Create User'}
                      </span>
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