import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { User, Role, CreateUserData, UpdateUserData } from '../services/userService'

interface UserModalProps {
  user?: User | null
  roles: Role[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateUserData | UpdateUserData) => void
  isLoading: boolean
  false?: boolean
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
  const [showPassword, setShowPassword] = useState(false)

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
          role_ids: formData.role_ids,  // Backend expects "role_ids"
          force_two_factor: formData.force_two_factor,
          ...(formData.password && { password: formData.password })
        }
      : {
          ...formData,
          role_ids: formData.role_ids  // Backend expects "role_ids"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30" 
            onClick={onClose} 
          />

          {/* Modal - Compact Size */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.25, type: "spring", damping: 25, stiffness: 300 }}
            className={`relative rounded-2xl shadow-2xl transform w-full max-w-2xl mx-4 overflow-hidden border transition-colors duration-300 ${
              false 
                ? 'bg-slate-800 border-slate-700/50' 
                : 'bg-white border-white/20'
            }`}
          >
              {/* Compact Header */}
              <div className="relative flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3.5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {user ? 'Edit User' : 'Create New User'}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {user ? 'Update user details and assign roles.' : 'Add user details and assign roles.'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Compact Form */}
              <form onSubmit={handleSubmit} className={`px-5 py-4 max-h-[calc(100vh-200px)] overflow-y-auto transition-colors duration-300 ${
                'bg-white'
              }`}>
                <div className="space-y-3">
                  {/* Basic Information Section */}
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {/* Username */}
                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 transition-colors ${
                          'text-slate-700'
                        }`}>
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition-all duration-200 ${
                            errors.username 
                              ? 'border-red-300 bg-red-50/50' 
                              : false 
                                ? 'border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400 hover:border-slate-500' 
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                          }`}
                          placeholder="Enter username"
                        />
                        {errors.username && (
                          <p className="mt-1 text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                            <span>⚠️</span> {errors.username}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className={`block text-[11px] font-semibold mb-1 transition-colors ${
                          'text-slate-700'
                        }`}>
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition-all duration-200 ${
                            errors.email 
                              ? 'border-red-300 bg-red-50/50' 
                              : false 
                                ? 'border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400 hover:border-slate-500' 
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                          }`}
                          placeholder="Enter email address"
                        />
                        {errors.email && (
                          <p className="mt-1 text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                            <span>⚠️</span> {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mt-2.5">
                      <label className={`block text-[11px] font-semibold mb-1 transition-colors ${
                        'text-slate-700'
                      }`}>
                        Password {user ? <span className="font-normal text-[10px] text-slate-500">(leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-2.5 py-1.5 pr-9 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition-all duration-200 ${
                            errors.password 
                              ? 'border-red-300 bg-red-50/50' 
                              : false 
                                ? 'border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400 hover:border-slate-500' 
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                          }`}
                          placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        {errors.password && (
                          <p className="mt-1 text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                            <span>⚠️</span> {errors.password}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Roles & Permissions Section */}
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5 text-slate-700">
                      Roles <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex flex-nowrap gap-2 overflow-x-auto ${errors.role_ids ? 'p-2 rounded-lg border border-red-300 bg-red-50/50' : ''}`}>
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className={`flex items-center cursor-pointer px-2.5 py-1.5 border rounded-lg transition-all duration-200 flex-shrink-0 ${
                            formData.role_ids.includes(role.id)
                              ? 'border-gray-400 bg-gray-100 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.role_ids.includes(role.id)}
                            onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-gray-700 focus:ring-gray-400 focus:ring-1 transition-colors duration-200 flex-shrink-0"
                          />
                          <span className="ml-1.5 text-xs font-medium text-slate-700 capitalize whitespace-nowrap">{role.name}</span>
                        </label>
                      ))}
                    </div>
                    {errors.role_ids && (
                      <p className="mt-1.5 text-[10px] text-red-600 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {errors.role_ids}
                      </p>
                    )}
                    {formData.role_ids.length === 0 && !errors.role_ids && (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Select at least one role for the user.
                      </p>
                    )}
                  </div>

                  {/* Status Section */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
                    <div className="flex items-center pt-2">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-gray-700 focus:ring-gray-400 focus:ring-1"
                        />
                        <span className="ml-2 text-[11px] font-semibold text-slate-700">User is active</span>
                      </label>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          name="force_two_factor"
                          checked={formData.force_two_factor}
                          onChange={handleInputChange}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-gray-700 focus:ring-gray-400 focus:ring-1"
                        />
                        <span className="ml-2 text-[11px] font-semibold text-slate-700">Force 2FA</span>
                      </label>
                    </div>
                  </div>
                </div>
              </form>

              {/* Actions */}
              <div className={`px-5 py-3 border-t flex justify-end items-center transition-colors duration-300 ${
                false 
                  ? 'bg-gradient-to-r from-slate-900/50 via-gray-800/20 to-purple-900/20 border-slate-700' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-1.5 text-xs font-semibold border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm ${
                      false 
                        ? 'text-slate-300 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500 focus:ring-slate-500/50' 
                        : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-300/50'
                    }`}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-400 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400/50 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-1.5">
                        <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{user ? 'Updating...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>{user ? 'Update User' : 'Create User'}</span>
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

