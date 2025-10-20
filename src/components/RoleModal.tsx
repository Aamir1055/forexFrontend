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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{role ? 'Edit Role' : 'Create New Role'}</h2>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. Marketing Manager"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of the role and its purpose"
                    />
                  </div>
                </div>

                {/* Right Column - Permissions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
                  <p className="text-sm text-gray-600 mb-6">Select the permissions for this role. Permissions are grouped by category.</p>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <h4 className="font-medium text-gray-900">{category}</h4>
                        </div>
                        <div className="space-y-2">
                          {categoryPermissions.map((permission) => {
                            // Use the permission ID (from permissions table)
                            const permissionId = permission.id;
                            if (!permissionId) return null;
                            
                            const isChecked = formData.permission_ids.includes(permissionId);
                            console.log(`Permission ${permission.name} (ID: ${permissionId}): ${isChecked ? 'CHECKED' : 'unchecked'}`); // Debug log
                            
                            return (
                              <label key={permissionId} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(permissionId)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-3 text-sm text-gray-700">{permission.description || permission.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-4">
              <button 
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {role ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  role ? 'Update Role' : 'Create Role'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default RoleModal