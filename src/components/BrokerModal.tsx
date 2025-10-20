import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { brokerRightsService } from '../services/brokerRightsService'
import { brokerService } from '../services/brokerService'
import { accountMappingService } from '../services/accountMappingService'
import { Broker, CreateBrokerData, UpdateBrokerData, AccountMapping } from '../types'
import toast from 'react-hot-toast'

interface BrokerModalProps {
  broker: Broker | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBrokerData | UpdateBrokerData) => void
  isLoading: boolean
}

const BrokerModal: React.FC<BrokerModalProps> = ({
  broker,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions' | 'account-mapping'>('basic')
  const [formData, setFormData] = useState<CreateBrokerData>({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    account_range_from: 1000,
    account_range_to: 2000,
    is_active: true,
    credit_limit: undefined,
    default_percentage: undefined,
    match_all_condition: undefined
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedRights, setSelectedRights] = useState<number[]>([])
  const [isSyncingToAll, setIsSyncingToAll] = useState(false)
  
  // Account mapping form state
  const [accountMappingData, setAccountMappingData] = useState({
    field_name: '',
    operator_type: '=',
    field_value: ''
  })
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([])
  const [pendingMappings, setPendingMappings] = useState<Array<{
    id: string
    account_type: string
    account_number: string
    field_name: string
    field_value: string
  }>>([])
  const [accountMappingErrors, setAccountMappingErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  // Fetch existing account mappings when editing a broker
  const { data: existingAccountMappings, isLoading: accountMappingsLoading } = useQuery(
    ['account-mappings', broker?.id],
    () => accountMappingService.getBrokerAccountMappings(broker!.id),
    {
      enabled: !!broker?.id && isOpen,
      onSuccess: (data) => {
        setAccountMappings(data || [])
      },
      onError: (error) => {
        console.error('Failed to fetch account mappings:', error)
        setAccountMappings([])
      }
    }
  )



  // Bulk sync mutation
  const bulkSyncMutation = useMutation(
    async (rightIds: number[]) => {
      setIsSyncingToAll(true)
      
      // First fetch all brokers
      const brokersResponse = await brokerService.getBrokers(1, 1000)
      const allBrokers = brokersResponse.brokers
      
      let successCount = 0
      let errorCount = 0
      
      // Sync rights to each broker
      for (const broker of allBrokers) {
        try {
          await brokerRightsService.syncBrokerRights(broker.id, rightIds)
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Failed to sync rights to broker ${broker.id}:`, error)
        }
      }
      
      return { successCount, errorCount }
    },
    {
      onSuccess: ({ successCount, errorCount }) => {
        queryClient.invalidateQueries(['broker-rights'])
        if (errorCount === 0) {
          toast.success(`Successfully synced rights to all ${successCount} brokers!`)
        } else {
          toast.success(`Synced rights to ${successCount} brokers. ${errorCount} failed.`)
        }
      },
      onError: (error: any) => {
        toast.error(`Failed to sync rights: ${error.response?.data?.message || error.message}`)
      },
      onSettled: () => {
        setIsSyncingToAll(false)
      }
    }
  )

  // Create account mapping mutation
  const createAccountMappingMutation = useMutation(
    (mappingData: { field_name: string; operator_type: string; field_value: string }) =>
      accountMappingService.createAccountMapping(broker!.id, mappingData),
    {
      onSuccess: (newMapping) => {
        // Update local state immediately for instant UI feedback
        setAccountMappings(prev => [...prev, newMapping])
        // Invalidate and refetch the cache to keep it in sync
        queryClient.invalidateQueries(['account-mappings', broker!.id])
        // Reset form
        setAccountMappingData({ field_name: '', operator_type: '=', field_value: '' })
        setAccountMappingErrors({})
        toast.success('Account mapping added successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to add account mapping')
      }
    }
  )

  // Delete account mapping mutation
  const deleteAccountMappingMutation = useMutation(
    (mappingId: number) => accountMappingService.deleteAccountMapping(broker!.id, mappingId),
    {
      onSuccess: (_, mappingId) => {
        // Update local state immediately for instant UI feedback
        setAccountMappings(prev => prev.filter(mapping => mapping.id !== mappingId))
        // Invalidate and refetch the cache to keep it in sync
        queryClient.invalidateQueries(['account-mappings', broker!.id])
        toast.success('Account mapping deleted successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete account mapping')
      }
    }
  )

  // Fetch broker's current rights if editing
  const { data: brokerRights } = useQuery(
    ['broker-rights', broker?.id],
    () => brokerRightsService.getBrokerRights(broker!.id),
    {
      enabled: !!broker?.id
    }
  )

  // Sync rights mutation
  const syncRightsMutation = useMutation(
    ({ brokerId, rightIds }: { brokerId: number; rightIds: number[] }) =>
      brokerRightsService.syncBrokerRights(brokerId, rightIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['broker-rights'])
        toast.success('Broker permissions updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update permissions')
      }
    }
  )

  useEffect(() => {
    if (broker) {
      setFormData({
        username: broker.username || '',
        password: '',
        full_name: broker.full_name || '',
        email: broker.email || '',
        phone: broker.phone || '',
        account_range_from: broker.account_range_from || 1000,
        account_range_to: broker.account_range_to || 2000,
        is_active: broker.is_active ?? true,
        credit_limit: broker.credit_limit,
        default_percentage: broker.default_percentage,
        match_all_condition: broker.match_all_condition
      })
      // Set selected rights for existing broker
      setSelectedRights(brokerRights?.map(right => right.id) || [])
    } else {
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        account_range_from: 1000,
        account_range_to: 2000,
        is_active: true,
        credit_limit: undefined,
        default_percentage: undefined,
        match_all_condition: undefined
      })
      setSelectedRights([])
      setAccountMappings([])
      setPendingMappings([]) // Clear pending mappings for new broker
    }
    setErrors({})
    setActiveTab('basic')
    // Reset account mapping form
    setAccountMappingData({ field_name: '', operator_type: '=', field_value: '' })
    setAccountMappingErrors({})
  }, [broker, brokerRights])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name || !formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.username || !formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!broker && (!formData.password || !formData.password.trim())) {
      newErrors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.account_range_from || formData.account_range_from < 1) {
      newErrors.account_range_from = 'Account range from is required and must be greater than 0'
    }

    if (!formData.account_range_to || formData.account_range_to < 1) {
      newErrors.account_range_to = 'Account range to is required and must be greater than 0'
    }

    if (formData.account_range_from && formData.account_range_to && formData.account_range_from >= formData.account_range_to) {
      newErrors.account_range_to = 'Account range to must be greater than account range from'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setActiveTab('basic')
      return
    }

    try {
      // Check if there's a pending account mapping that needs to be saved
      const hasPendingMapping = accountMappingData.field_name.trim() && accountMappingData.field_value.trim()
      
      if (hasPendingMapping && broker?.id) {
        // Validate the pending mapping
        if (validateAccountMapping()) {
          // Save the pending account mapping first
          await createAccountMappingMutation.mutateAsync(accountMappingData)
        } else {
          // If validation fails, switch to account mapping tab to show errors
          setActiveTab('account-mapping')
          toast.error('Please complete or fix the account mapping before updating the broker')
          return
        }
      }

      // Clean up data for API submission
      const cleanedData = {
        username: formData.username,
        password: formData.password || undefined,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        account_range_from: formData.account_range_from,
        account_range_to: formData.account_range_to,
        is_active: formData.is_active,
        credit_limit: formData.credit_limit,
        default_percentage: formData.default_percentage,
        match_all_condition: formData.match_all_condition,
        right_ids: selectedRights // Use selected permissions
      }

      // Create/update the broker
      const result = await onSubmit(cleanedData)
      
      // If this was a new broker creation and we have pending mappings, save them
      if (!broker && pendingMappings.length > 0 && result?.id) {
        try {
          for (const mapping of pendingMappings) {
            await accountMappingService.createAccountMapping({
              broker_id: result.id,
              account_type: mapping.account_type,
              account_number: mapping.account_number,
              field_name: mapping.field_name,
              field_value: mapping.field_value
            })
          }
          setPendingMappings([]) // Clear pending mappings after successful save
          toast.success('Broker and account mappings created successfully!')
        } catch (error) {
          console.error('Failed to save account mappings:', error)
          toast.error('Broker created but some account mappings failed to save')
        }
      }
      
      // Then sync permissions if broker exists or was just created
      const brokerId = broker?.id || result?.id
      if (brokerId) {
        await syncRightsMutation.mutateAsync({ 
          brokerId: brokerId, 
          rightIds: selectedRights 
        })
      }
    } catch (error) {
      // Error handling is done in the parent component and mutations
      console.error('Error in handleSubmit:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? (value === '' ? undefined : parseFloat(value)) :
              value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRightToggle = (rightId: number) => {
    setSelectedRights(prev => 
      prev.includes(rightId)
        ? prev.filter(id => id !== rightId)
        : [...prev, rightId]
    )
  }

  // Mock permissions data organized by categories
  const permissionCategories = [
    {
      name: 'Account Management',
      permissions: [
        { id: 1, name: 'Account Open', description: 'Allow broker to create new accounts' },
        { id: 2, name: 'Account Edit', description: 'Allow broker to edit account details' },
        { id: 3, name: 'Account Close', description: 'Allow broker to close accounts' }
      ]
    },
    {
      name: 'Financial Operations',
      permissions: [
        { id: 4, name: 'Credit In', description: 'Allow broker to add credit to accounts' },
        { id: 5, name: 'Credit Out', description: 'Allow broker to withdraw credit from accounts' },
        { id: 6, name: 'Transfer Funds', description: 'Allow broker to transfer funds between accounts' }
      ]
    },
    {
      name: 'Trading Operations',
      permissions: [
        { id: 7, name: 'Set Percentage', description: 'Allow broker to set percentage/commission' },
        { id: 8, name: 'Place Orders', description: 'Allow broker to place orders on behalf of clients' },
        { id: 9, name: 'Cancel Orders', description: 'Allow broker to cancel orders' },
        { id: 10, name: 'Modify Limits', description: 'Allow broker to modify trading limits' },
        { id: 11, name: 'View Positions', description: 'Allow broker to view client positions' }
      ]
    },
    {
      name: 'Reports & Analytics',
      permissions: [
        { id: 12, name: 'View Reports', description: 'Allow broker to view reports' },
        { id: 13, name: 'View Ledger', description: 'Allow broker to view account ledgers' }
      ]
    },
    {
      name: 'Group Management',
      permissions: [
        { id: 14, name: 'Manage Groups', description: 'Allow broker to manage client groups' }
      ]
    }
  ]



  // Account mapping validation
  const validateAccountMapping = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!accountMappingData.field_name.trim()) {
      newErrors.field_name = 'Field name is required'
    }

    if (!accountMappingData.field_value.trim()) {
      newErrors.field_value = 'Field value is required'
    }

    setAccountMappingErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle account mapping form submission
  const handleAccountMappingSubmit = () => {
    if (!validateAccountMapping()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!broker?.id) {
      toast.error('Please save the broker first before adding account mappings')
      return
    }

    createAccountMappingMutation.mutate(accountMappingData)
  }

  // Handle adding pending mapping for new brokers
  const handleAddPendingMapping = () => {
    if (!validateAccountMapping()) {
      toast.error('Please fill in all required fields')
      return
    }

    const newPendingMapping = {
      id: Date.now().toString(), // Temporary ID
      account_type: accountMappingData.account_type,
      account_number: accountMappingData.account_number,
      field_name: accountMappingData.field_name,
      field_value: accountMappingData.field_value
    }

    setPendingMappings(prev => [...prev, newPendingMapping])
    
    // Reset form
    setAccountMappingData({
      account_type: '',
      account_number: '',
      field_name: '',
      field_value: ''
    })
    
    toast.success('Account mapping added! It will be saved when you create the broker.')
  }

  // Remove pending mapping
  const handleRemovePendingMapping = (id: string) => {
    setPendingMappings(prev => prev.filter(mapping => mapping.id !== id))
    toast.success('Pending mapping removed')
  }

  // Remove account mapping
  const handleRemoveMapping = (mappingId: number) => {
    if (window.confirm('Are you sure you want to delete this account mapping?')) {
      deleteAccountMappingMutation.mutate(mappingId)
    }
  }

  // Handle sync selected rights to all brokers
  const handleSyncToAllBrokers = () => {
    if (selectedRights.length === 0) {
      toast.error('Please select at least one permission to sync')
      return
    }

    const selectedPermissionNames = permissionCategories
      .flatMap(cat => cat.permissions)
      .filter(perm => selectedRights.includes(perm.id))
      .map(perm => perm.name)

    if (window.confirm(
      `This will sync the following ${selectedRights.length} permissions to ALL brokers in the system:\n\n` +
      `${selectedPermissionNames.join(', ')}\n\n` +
      `This action will overwrite existing permissions for all brokers. Continue?`
    )) {
      bulkSyncMutation.mutate(selectedRights)
    }
  }





  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>
            {`
              .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
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
              className="relative bg-white rounded-2xl shadow-2xl transform w-full max-w-4xl mx-4"
            >
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">{broker ? 'Edit Broker' : 'Create New Broker'}</h2>
                  <button 
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex px-4" aria-label="Tabs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('basic')}
                      className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'basic'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Basic Information
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('permissions')}
                      className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'permissions'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Broker Permissions
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('account-mapping')}
                      className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'account-mapping'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Add Account Mapping
                    </button>
                  </nav>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'basic' && (
                      <motion.div
                        key="basic"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Compact Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input
                              type="text"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.full_name ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="Enter full name"
                              required
                            />
                            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                            <input
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.username ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="Enter username"
                              required
                            />
                            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="Enter email"
                              required
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="Enter phone"
                              required
                            />
                            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                          </div>

                          {!broker && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                              <input
                                type="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="Enter password"
                                required
                              />
                              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Range From *</label>
                            <input
                              type="number"
                              name="account_range_from"
                              value={formData.account_range_from}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.account_range_from ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="1000"
                              required
                            />
                            {errors.account_range_from && <p className="mt-1 text-xs text-red-600">{errors.account_range_from}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Range To *</label>
                            <input
                              type="number"
                              name="account_range_to"
                              value={formData.account_range_to}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.account_range_to ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="2000"
                              required
                            />
                            {errors.account_range_to && <p className="mt-1 text-xs text-red-600">{errors.account_range_to}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Percentage (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              name="default_percentage"
                              value={formData.default_percentage || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                            <input
                              type="number"
                              step="0.01"
                              name="credit_limit"
                              value={formData.credit_limit || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter credit limit"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select 
                              name="is_active"
                              value={formData.is_active ? 'active' : 'inactive'}
                              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Match All Condition</label>
                            <select 
                              name="match_all_condition"
                              value={formData.match_all_condition === undefined ? '' : formData.match_all_condition ? 'true' : 'false'}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                match_all_condition: e.target.value === '' ? undefined : e.target.value === 'true' 
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Not Set</option>
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'permissions' && (
                      <motion.div
                        key="permissions"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className=""
                      >
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Broker Permissions</h3>
                          <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-gray-600">Select the permissions for this broker. Permissions are grouped by category.</p>
                            <button
                              type="button"
                              onClick={handleSyncToAllBrokers}
                              disabled={selectedRights.length === 0 || isSyncingToAll}
                              className="px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {isSyncingToAll ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Syncing...</span>
                                </>
                              ) : (
                                <>
                                  <ArrowPathIcon className="w-4 h-4" />
                                  <span>Sync to All</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Selected Rights Counter */}
                          {selectedRights.length > 0 && (
                            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                              <span className="text-sm text-blue-800 font-medium">
                                {selectedRights.length} permission(s) selected
                              </span>
                            </div>
                          )}



                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {permissionCategories.map((category) => (
                              <div key={category.name} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                                </div>
                                <div className="space-y-2">
                                  {category.permissions.map((permission) => {
                                    const isChecked = selectedRights.includes(permission.id);
                                    
                                    return (
                                      <label key={permission.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleRightToggle(permission.id)}
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
                      </motion.div>
                    )}

                    {activeTab === 'account-mapping' && (
                      <motion.div
                        key="account-mapping"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className=""
                      >
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Mappings</h3>
                          <p className="text-sm text-gray-600 mb-6">Configure field mapping conditions for this broker. You can add multiple mappings.</p>
                        </div>

                        {/* Loading state for account mappings */}
                        {accountMappingsLoading && broker?.id && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-gray-700">Loading Mappings...</h4>
                            </div>
                            <div className="space-y-3">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Existing Mappings List */}
                        {!accountMappingsLoading && accountMappings && accountMappings.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-gray-700">Current Mappings ({accountMappings.length})</h4>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {accountMappings.filter(mapping => mapping && mapping.field_name).map((mapping) => (
                                <div key={mapping.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                  <div className="flex-1">
                                    <span className="text-sm text-gray-700">
                                      <strong className="text-blue-600">{mapping.field_name}</strong> 
                                      <span className="mx-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{mapping.operator_type}</span> 
                                      <strong className="text-green-600">{mapping.field_value}</strong>
                                    </span>
                                    {mapping.created_at && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Created: {new Date(mapping.created_at).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMapping(mapping.id)}
                                    disabled={deleteAccountMappingMutation.isLoading}
                                    className="ml-3 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {deleteAccountMappingMutation.isLoading ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending Mappings List (for new brokers) */}
                        {!broker && pendingMappings.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-gray-700">Pending Mappings ({pendingMappings.length})</h4>
                              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Will be saved with broker</span>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {pendingMappings.map((mapping) => (
                                <div key={mapping.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                                  <div className="flex-1">
                                    <span className="text-sm text-gray-700">
                                      <strong className="text-blue-600">{mapping.field_name}</strong> 
                                      <span className="mx-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{mapping.account_type}</span> 
                                      <strong className="text-green-600">{mapping.field_value}</strong>
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Account: {mapping.account_number}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePendingMapping(mapping.id)}
                                    className="ml-3 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add New Mapping Form */}
                        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-700">Add New Mapping</h4>
                            <button
                              type="button"
                              onClick={broker?.id ? handleAccountMappingSubmit : handleAddPendingMapping}
                              disabled={createAccountMappingMutation.isLoading}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {createAccountMappingMutation.isLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  {broker?.id ? 'Add Mapping' : 'Add to Pending'}
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Field Name *
                              </label>
                              <input
                                type="text"
                                name="field_name"
                                value={accountMappingData.field_name}
                                onChange={(e) => {
                                  setAccountMappingData(prev => ({ ...prev, field_name: e.target.value }))
                                  if (accountMappingErrors.field_name) {
                                    setAccountMappingErrors(prev => ({ ...prev, field_name: '' }))
                                  }
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  accountMappingErrors.field_name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="e.g., State, Account, Region"
                              />
                              {accountMappingErrors.field_name && (
                                <p className="mt-1 text-sm text-red-600">{accountMappingErrors.field_name}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Operator Type
                              </label>
                              <select
                                name="operator_type"
                                value={accountMappingData.operator_type}
                                onChange={(e) => setAccountMappingData(prev => ({ ...prev, operator_type: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="=">=</option>
                                <option value="IN">IN</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">&gt;=</option>
                                <option value="<=">&lt;=</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Field Value *
                              </label>
                              <input
                                type="text"
                                name="field_value"
                                value={accountMappingData.field_value}
                                onChange={(e) => {
                                  setAccountMappingData(prev => ({ ...prev, field_value: e.target.value }))
                                  if (accountMappingErrors.field_value) {
                                    setAccountMappingErrors(prev => ({ ...prev, field_value: '' }))
                                  }
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  accountMappingErrors.field_value ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="e.g., 245 or 432,5235,532532 for IN operator"
                              />
                              {accountMappingErrors.field_value && (
                                <p className="mt-1 text-sm text-red-600">{accountMappingErrors.field_value}</p>
                              )}
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h5 className="text-sm font-medium text-blue-900 mb-2">Preview</h5>
                            <p className="text-sm text-blue-700">
                              {accountMappingData.field_name && accountMappingData.field_value ? (
                                <>
                                  <strong>{accountMappingData.field_name}</strong> {accountMappingData.operator_type} <strong>{accountMappingData.field_value}</strong>
                                </>
                              ) : (
                                'Fill in the fields above to see a preview of your mapping condition.'
                              )}
                            </p>
                          </div>

                          {/* Examples */}
                          <div className="mt-4 text-sm text-gray-500">
                            <p className="font-medium mb-2">Examples:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li><strong>State = 245:</strong> Match accounts in state 245</li>
                              <li><strong>Account IN 432,5235:</strong> Match specific account IDs</li>
                              <li><strong>Balance &gt; 1000:</strong> Match accounts with balance over 1000</li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Form Actions */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-4">
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      disabled={isLoading}
                    >
                      Cancel
                    </motion.button>
                    {activeTab === 'permissions' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className="px-6 py-3 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        disabled={isLoading}
                      >
                        Back to Basic Info
                      </motion.button>
                    )}
                    {activeTab === 'account-mapping' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setActiveTab('permissions')}
                        className="px-6 py-3 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        disabled={isLoading}
                      >
                        Back to Permissions
                      </motion.button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    {activeTab === 'basic' ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          if (validateForm()) {
                            setActiveTab('permissions')
                          }
                        }}
                        className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl flex items-center"
                      >
                        Next: Permissions
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    ) : activeTab === 'permissions' ? (
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setActiveTab('account-mapping')}
                          className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl flex items-center"
                        >
                          Next: Account Mapping
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                          disabled={isLoading || syncRightsMutation.isLoading}
                        >
                          {isLoading || syncRightsMutation.isLoading ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {broker ? 'Updating Broker...' : 'Creating Broker...'}
                            </div>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {broker ? 'Update Broker' : 'Create Broker'}
                            </>
                          )}
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        disabled={isLoading || syncRightsMutation.isLoading}
                      >
                        {isLoading || syncRightsMutation.isLoading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {broker ? 'Updating Broker...' : 'Creating Broker...'}
                          </div>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {broker ? 'Update Broker' : 'Create Broker'}
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default BrokerModal