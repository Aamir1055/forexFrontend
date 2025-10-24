import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

import { Role, Permission, CreateRoleData, UpdateRoleData } from '../types'

interface RoleModalProps {
  role: Role | null
  permissions: Permission[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateRoleData | UpdateRoleData) => void
  isLoading: boolean
}

const RoleModal: React.FC<RoleModalProps> = ({
  role,
  permissions,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: [] as number[]
  })

  useEffect(() => {
    if (isOpen) {
      if (role) {
        // When editing, extract permission_id from role's permissions (this is what the API uses)
        const permIds = role.permissions?.map(p => p.permission_id || p.id).filter((id): id is number => id !== undefined) || []
        console.log('Loading role permissions:', permIds) // Debug log
        setFormData({
          name: role.name,
          description: role.description || '',
          permission_ids: permIds
        })
      } else {
        // When creating new role
        setFormData({
          name: '',
          description: '',
          permission_ids: []
        })
      }
    }
  }, [role, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting role data:', formData) // Debug log
    onSubmit(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePermissionToggle = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter(id => id !== permissionId)
        : [...prev.permission_ids, permissionId]
    }))
  }

  const handleSelectAllCategory = (categoryPermissions: Permission[]) => {
    const categoryIds = categoryPermissions.map(p => p.id).filter((id): id is number => id !== undefined)
    const allSelected = categoryIds.every(id => formData.permission_ids.includes(id))
    
    setFormData(prev => ({
      ...prev,
      permission_ids: allSelected
        ? prev.permission_ids.filter(id => !categoryIds.includes(id))
        : [...new Set([...prev.permission_ids, ...categoryIds])]
    }))
  }

  const handleSelectAll = () => {
    const allPermissionIds = permissions.map(p => p.id).filter((id): id is number => id !== undefined)
    const allSelected = allPermissionIds.length > 0 && allPermissionIds.every(id => formData.permission_ids.includes(id))
    
    setFormData(prev => ({
      ...prev,
      permission_ids: allSelected ? [] : allPermissionIds
    }))
  }

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600">
              <div>
                <h2 className="text-lg font-bold text-white">{role ? 'Edit Role' : 'Create New Role'}</h2>
                <p className="text-blue-100 text-xs mt-0.5">Define role permissions and access levels</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] bg-gray-50">
              <form id="role-form" onSubmit={handleSubmit}>
                {/* Basic Info Section */}
                <div className="px-6 py-4 bg-white">
                  <div className="flex items-center mb-3">
                    <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-2"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Role Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                        placeholder="e.g. Marketing Manager"
                        required
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                        placeholder="Brief description of the role"
                      />
                    </div>
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="px-6 py-3 bg-white mt-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-2"></div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Select the permissions for this role</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                      <input 
                        type="checkbox"
                        checked={permissions.length > 0 && permissions.every(p => p.id && formData.permission_ids.includes(p.id))}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-xs font-medium text-gray-700">Select All</span>
                    </label>
                  </div>
                  <div className="space-y-2 mt-3">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                      const categoryIds = categoryPermissions.map(p => p.id).filter((id): id is number => id !== undefined)
                      const allCategorySelected = categoryIds.length > 0 && categoryIds.every(id => formData.permission_ids.includes(id))
                      
                      return (
                        <div key={category} className="bg-white rounded-lg p-2.5 border border-gray-200">
                          <div className="flex items-center mb-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mr-1.5"></div>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{category}</h4>
                            <div className="ml-auto flex items-center gap-2">
                              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full font-medium">
                                {categoryPermissions.filter(p => formData.permission_ids.includes(p.id)).length}/{categoryPermissions.length}
                              </div>
                              <label className="flex items-center cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={allCategorySelected}
                                  onChange={() => handleSelectAllCategory(categoryPermissions)}
                                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                              </label>
                            </div>
                          </div>
                        <div className="space-y-1.5">
                          {categoryPermissions.map((permission) => {
                            // Use the permission ID (from permissions table)
                            const permissionId = permission.id;
                            if (!permissionId) return null;
                            
                            const isChecked = formData.permission_ids.includes(permissionId);
                            console.log(`Permission ${permission.name} (ID: ${permissionId}): ${isChecked ? 'CHECKED' : 'unchecked'}`); // Debug log
                            
                            return (
                              <label 
                                key={permissionId} 
                                className={`group flex items-start cursor-pointer px-2 py-1.5 rounded-md transition-all border ${
                                  isChecked 
                                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                                    : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(permissionId)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 mt-0.5"
                                />
                                <span className={`ml-2 text-xs font-medium transition-colors ${
                                  isChecked ? 'text-blue-900' : 'text-gray-700 group-hover:text-gray-900'
                                }`}>
                                  {permission.description || permission.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{formData.permission_ids.length}</span> permissions selected
              </p>
              <div className="flex items-center space-x-2.5">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="role-form"
                  disabled={isLoading || !formData.name.trim()}
                  className="px-5 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/30"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {role ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <span>{role ? 'Update Role' : 'Create Role'}</span>
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

export default RoleModal