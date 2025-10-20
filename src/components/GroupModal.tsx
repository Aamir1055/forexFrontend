import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ServerIcon } from '@heroicons/react/24/outline'
import { Group, CreateGroupData, UpdateGroupData } from '../types'

interface GroupModalProps {
  group: Group | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateGroupData | UpdateGroupData) => void
  isLoading: boolean
}

const GroupModal: React.FC<GroupModalProps> = ({
  group,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<CreateGroupData>({
    mt5_group: '',
    broker_view_group: '',
    description: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (group) {
      setFormData({
        mt5_group: group.mt5_group || '',
        broker_view_group: group.broker_view_group || '',
        description: group.description || '',
        is_active: group.is_active ?? true
      })
    } else {
      setFormData({
        mt5_group: '',
        broker_view_group: '',
        description: '',
        is_active: true
      })
    }
    setErrors({})
  }, [group, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.mt5_group || !formData.mt5_group.trim()) {
      newErrors.mt5_group = 'MT5 Group is required'
    }

    if (!formData.broker_view_group || !formData.broker_view_group.trim()) {
      newErrors.broker_view_group = 'Broker View Group is required'
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  const suggestedMT5Groups = [
    'demo\\standard',
    'demo\\premium',
    'demo\\vip',
    'real\\standard',
    'real\\premium',
    'real\\vip',
    'real\\pro',
    'demo\\pro'
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" 
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white rounded-lg shadow-xl transform w-full max-w-md mx-4"
            >
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <ServerIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {group ? 'Edit Group' : 'Create Group'}
                      </h2>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Content */}
                <div className="px-4 py-4 space-y-4">
                  {/* MT5 Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MT5 Group *
                    </label>
                    <input
                      type="text"
                      name="mt5_group"
                      value={formData.mt5_group}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.mt5_group ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="e.g., demo\\standard"
                    />
                    {errors.mt5_group && (
                      <p className="mt-1 text-xs text-red-600">{errors.mt5_group}</p>
                    )}
                    
                    {/* Suggestions */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Common patterns:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestedMT5Groups.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, mt5_group: suggestion }))}
                            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Broker View Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Broker View Group *
                    </label>
                    <input
                      type="text"
                      name="broker_view_group"
                      value={formData.broker_view_group}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.broker_view_group ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Standard Demo"
                    />
                    {errors.broker_view_group && (
                      <p className="mt-1 text-xs text-red-600">{errors.broker_view_group}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Display name shown to brokers
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Describe the group purpose..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select 
                      name="is_active"
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
                  >
                    {isLoading && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    )}
                    <span>{group ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default GroupModal