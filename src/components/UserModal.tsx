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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-blue-900/30 to-purple-900/30" 
            onClick={onClose} 
          />

          {/* Modal - Compact Size */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.25, type: "spring", damping: 25, stiffness: 300 }}
            className={`relative rounded-2xl shadow-2xl transform w-full max-w-xl mx-4 overflow-hidden border transition-colors duration-300 ${
              false 
                ? 'bg-slate-800 border-slate-700/50' 
                : 'bg-white border-white/20'
            }`}
          >
              {/* Compact Header with Gradient */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/30">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {user ? 'Edit User' : 'Create New User'}
                      </h3>
                      <p className="text-blue-100 text-[10px]">
                        {user ? 'Update user information' : 'Add a new user to the system'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
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
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
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
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
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
                      <div>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                            errors.password 
                              ? 'border-red-300 bg-red-50/50' 
                              : false 
                                ? 'border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400 hover:border-slate-500' 
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                          }`}
                          placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
                        />
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
                    <label className={`block text-[11px] font-semibold mb-1.5 transition-colors ${
                      'text-slate-700'
                    }`}>
                      Roles <span className="text-red-500">*</span>
                    </label>
                    <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-2.5 rounded-lg border ${
                      errors.role_ids 
                        ? 'border-red-300 bg-red-50/50' 
                        : false 
                          ? 'border-slate-600 bg-gradient-to-br from-slate-700/50 to-blue-900/20' 
                          : 'border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30'
                    }`}>
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className={`flex items-center cursor-pointer px-2 py-1.5 border rounded-lg transition-all duration-200 ${
                            formData.role_ids.includes(role.id) 
                              ? false
                                ? 'border-blue-500 bg-blue-900/30 shadow-sm shadow-blue-500/20 scale-105' 
                                : 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-500/20 scale-105'
                              : false
                                ? 'border-slate-600 bg-slate-700/30 hover:border-blue-400 hover:shadow-sm'
                                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.role_ids.includes(role.id)}
                            onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                            className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-1 transition-colors duration-200"
                          />
                          <span className={`ml-1.5 text-[11px] font-semibold transition-colors ${
                            'text-slate-700'
                          }`}>{role.name}</span>
                        </label>
                      ))}
                    </div>
                    {errors.role_ids && (
                      <p className={`mt-1.5 text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded border ${
                        false 
                          ? 'text-red-400 bg-red-900/30 border-red-800' 
                          : 'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        <span>⚠️</span> {errors.role_ids}
                      </p>
                    )}
                    {formData.role_ids.length === 0 && !errors.role_ids && (
                      <p className={`mt-1.5 text-[10px] font-medium flex items-center gap-1 px-2 py-1 rounded border ${
                        false 
                          ? 'text-amber-400 bg-amber-900/30 border-amber-800' 
                          : 'text-amber-600 bg-amber-50 border-amber-200'
                      }`}>
                        <span>💡</span> Select at least one role for the user
                      </p>
                    )}
                  </div>

                  {/* Status Section */}
                  <div className="space-y-1.5">
                    <label className={`flex items-center cursor-pointer px-2 py-1.5 border rounded-lg transition-all group ${
                      false 
                        ? 'border-slate-600 hover:bg-gradient-to-br hover:from-yellow-900/30 hover:to-yellow-800/20 hover:border-yellow-600' 
                        : 'border-slate-200 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-yellow-100/30 hover:border-yellow-300'
                    }`}>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500 focus:ring-1 transition-colors duration-200"
                      />
                      <span className={`ml-2 text-[11px] font-semibold transition-colors ${
                        false ? 'text-slate-300 group-hover:text-yellow-400' : 'text-slate-700 group-hover:text-yellow-700'
                      }`}>User is active</span>
                    </label>
                    
                    <label className={`flex items-center cursor-pointer px-2 py-1.5 border rounded-lg transition-all group ${
                      false 
                        ? 'border-slate-600 hover:bg-gradient-to-br hover:from-orange-900/30 hover:to-orange-800/20 hover:border-orange-600' 
                        : 'border-slate-200 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100/30 hover:border-orange-300'
                    }`}>
                      <input
                        type="checkbox"
                        name="force_two_factor"
                        checked={formData.force_two_factor}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 focus:ring-1 transition-colors duration-200"
                      />
                      <span className={`ml-2 text-[11px] font-semibold transition-colors ${
                        false ? 'text-slate-300 group-hover:text-orange-400' : 'text-slate-700 group-hover:text-orange-700'
                      }`}>Force 2FA 🔐</span>
                    </label>
                  </div>
                </div>
              </form>

              {/* Actions */}
              <div className={`px-5 py-3 border-t flex justify-end items-center transition-colors duration-300 ${
                false 
                  ? 'bg-gradient-to-r from-slate-900/50 via-blue-900/20 to-purple-900/20 border-slate-700' 
                  : 'bg-gradient-to-r from-slate-50 via-blue-50/30 to-purple-50/20 border-slate-200'
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
                    className="px-5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
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
                        <span className="text-sm">{user ? '💾' : '✨'}</span>
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

