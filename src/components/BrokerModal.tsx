import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { brokerRightsService } from '../services/brokerRightsService'
import { brokerService } from '../services/brokerService'
import { accountMappingService } from '../services/accountMappingService'
import { brokerProfileService } from '../services/brokerProfileService'
import { brokerGroupMappingService } from '../services/brokerGroupMappingService'
import { roleService } from '../services/roleService'
import { groupService } from '../services/groupService'
import { mt5SuggestionsService } from '../services/mt5SuggestionsService'
import { Broker, CreateBrokerData, UpdateBrokerData, AccountMapping } from '../types'
import toast from 'react-hot-toast'

interface BrokerModalProps {
  broker: Broker | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBrokerData | UpdateBrokerData) => Promise<Broker | void>
  isLoading: boolean
}

const BrokerModal: React.FC<BrokerModalProps> = ({
  broker,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions' | 'profiles' | 'account-mapping'>('basic')
  const [profileSubTab, setProfileSubTab] = useState<'rights' | 'groups'>('rights')
  const [resourceType, setResourceType] = useState<'profile' | 'role' | 'group'>('profile')
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [rolePermissions, setRolePermissions] = useState<number[]>([])
  const [editableRolePermissions, setEditableRolePermissions] = useState<number[]>([])
  const [profileGroups, setProfileGroups] = useState<number[]>([])
  const [editableProfileGroups, setEditableProfileGroups] = useState<number[]>([])
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
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
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
    field_name: string
    field_value: string
    operator_type: string
  }>>([])
  const [accountMappingErrors, setAccountMappingErrors] = useState<Record<string, string>>({})
  const [mt5Suggestions, setMt5Suggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const queryClient = useQueryClient()

  // Fetch existing account mappings when editing a broker
  const { isLoading: accountMappingsLoading } = useQuery(
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

  // Fetch all broker profiles
  const { data: brokerProfiles, isLoading: profilesLoading } = useQuery(
    ['broker-profiles'],
    () => brokerProfileService.getAllProfiles(),
    {
      enabled: isOpen
    }
  )

  // Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery(
    ['roles'],
    () => roleService.getRoles(true),
    {
      enabled: isOpen
    }
  )

  // Fetch all groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery(
    ['groups-all'],
    () => groupService.getGroups(1, 1000),
    {
      enabled: isOpen && activeTab === 'profiles'
    }
  )

  // Fetch all available broker rights
  const { data: allBrokerRights, isLoading: allRightsLoading } = useQuery(
    ['all-broker-rights'],
    () => brokerRightsService.getAllRights(),
    {
      enabled: isOpen && activeTab === 'profiles'
    }
  )

  // Fetch MT5 suggestions based on selected field
  const fetchMT5Suggestions = async (fieldName: string, query?: string) => {
    if (!fieldName) return
    
    setLoadingSuggestions(true)
    try {
      // Map field names to MT5 API field names
      const fieldMapping: Record<string, string> = {
        'Account': 'login',
        'Group': 'group',
        'Name': 'name',
        'LastName': 'name',
        'MiddleName': 'name',
        'Email': 'email',
        'Phone': 'phone',
        'Company': 'company',
        'Status': 'status',
        'LeadCampaign': 'leadCampaign',
        'LeadSource': 'leadSource',
        'Country': 'country',
        'State': 'state',
        'City': 'city',
        'ZipCode': 'zipCode',
        'Address': 'address',
        'Comment': 'comment'
      }

      const mt5Field = fieldMapping[fieldName]
      if (mt5Field) {
        const suggestions = await mt5SuggestionsService.getSuggestions(mt5Field, query)
        setMt5Suggestions(suggestions)
      }
    } catch (error) {
      // Silently fail - user can still type manually
      setMt5Suggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Fetch suggestions when field name changes
  useEffect(() => {
    if (accountMappingData.field_name) {
      fetchMT5Suggestions(accountMappingData.field_name)
    } else {
      setMt5Suggestions([])
    }
  }, [accountMappingData.field_name])



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

  // Sync groups mutation
  const syncGroupsMutation = useMutation(
    ({ brokerId, groupIds }: { brokerId: number; groupIds: number[] }) =>
      brokerGroupMappingService.syncBrokerGroups(brokerId, groupIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['broker-groups'])
        toast.success('Broker groups updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update groups')
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
            await accountMappingService.createAccountMapping(result.id, {
              field_name: mapping.field_name,
              field_value: mapping.field_value,
              operator_type: mapping.operator_type
            })
          }
          setPendingMappings([]) // Clear pending mappings after successful save
          toast.success('Broker and account mappings created successfully!')
        } catch (error) {
          console.error('Failed to save account mappings:', error)
          toast.error('Broker created but some account mappings failed to save')
        }
      }
      
      // Then sync permissions and groups if broker exists or was just created
      const brokerId = broker?.id || result?.id
      if (brokerId) {
        // Sync rights
        await syncRightsMutation.mutateAsync({ 
          brokerId: brokerId, 
          rightIds: selectedRights 
        })
        
        // Sync groups
        if (selectedGroups.length > 0) {
          await syncGroupsMutation.mutateAsync({
            brokerId: brokerId,
            groupIds: selectedGroups
          })
        }
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
      field_name: accountMappingData.field_name,
      field_value: accountMappingData.field_value,
      operator_type: accountMappingData.operator_type
    }

    setPendingMappings(prev => [...prev, newPendingMapping])
    
    // Reset form
    setAccountMappingData({
      field_name: '',
      operator_type: '',
      field_value: ''
    })
    
    toast.success('Account mapping added! It will be saved when you create the broker.')
  }

  // Remove pending mapping
  const handleRemovePendingMapping = (id: string) => {
    setPendingMappings(prev => prev.filter(mapping => mapping.id !== id))
    toast.success('Pending mapping removed')
  }

  // Handle match all condition toggle
  const handleMatchAllConditionToggle = async () => {
    const newValue = formData.match_all_condition !== true
    
    // Update local state immediately for instant UI feedback
    setFormData(prev => ({ ...prev, match_all_condition: newValue }))
    
    // If broker exists, update it on the server immediately
    if (broker?.id) {
      try {
        await brokerService.updateMatchAllCondition(broker.id, newValue)
        toast.success(`Match All Condition ${newValue ? 'enabled' : 'disabled'}`)
      } catch (error: any) {
        // Revert local state if API call fails
        setFormData(prev => ({ ...prev, match_all_condition: !newValue }))
        toast.error(error.response?.data?.message || 'Failed to update match all condition')
      }
    } else {
      // For new brokers, just show feedback that it will be saved with the broker
      toast.success(`Match All Condition will be ${newValue ? 'enabled' : 'disabled'} when broker is created`)
    }
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

  // Handle profile selection - applies all rights and groups from the profile
  const handleProfileSelect = async (profileId: number) => {
    setSelectedProfile(profileId)
    
    try {
      // Fetch the profile details to get its rights and groups
      const profileDetails = await brokerProfileService.getProfileById(profileId)
      
      // Update selected rights with profile's rights
      const profileRightIds = profileDetails.rights.map(r => r.rightId)
      setSelectedRights(profileRightIds)
      
      // Update selected groups with profile's groups
      const profileGroupIds = profileDetails.groups.map(g => g.groupId)
      setSelectedGroups(profileGroupIds)
      
      toast.success(`Profile applied! ${profileRightIds.length} rights and ${profileGroupIds.length} groups assigned.`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile details')
    }
  }

  // Handle profile selection for ROLES tab - applies only rights from the profile
  const handleProfileSelectRoles = async (profileId: number) => {
    setSelectedProfile(profileId)
    
    try {
      // Fetch the profile details to get its rights
      const profileDetails = await brokerProfileService.getProfileById(profileId)
      
      // Update selected rights with profile's rights only
      const profileRightIds = profileDetails.rights.map(r => r.rightId)
      setSelectedRights(profileRightIds)
      
      toast.success(`Profile rights applied! ${profileRightIds.length} rights assigned.`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile details')
    }
  }

  // Handle profile selection for GROUPS tab - applies only groups from the profile
  const handleProfileSelectGroups = async (profileId: number) => {
    setSelectedProfile(profileId)
    
    try {
      // Fetch the profile details to get its groups
      const profileDetails = await brokerProfileService.getProfileById(profileId)
      
      // Update selected groups with profile's groups only
      const profileGroupIds = profileDetails.groups.map(g => g.groupId)
      setSelectedGroups(profileGroupIds)
      
      toast.success(`Profile groups applied! ${profileGroupIds.length} groups assigned.`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile details')
    }
  }

  // Handle profile selection for role editing - loads profile rights for editing
  const handleProfileSelectForRoleEditing = async (profileId: number | null) => {
    setSelectedProfile(profileId)
    
    if (!profileId) {
      setRolePermissions([])
      setEditableRolePermissions([])
      return
    }
    
    try {
      const profileDetails = await brokerProfileService.getProfileById(profileId)
      const profileRightIds = profileDetails.rights.map(r => r.rightId)
      setRolePermissions(profileRightIds)
      setEditableRolePermissions([...profileRightIds])
      toast.success(`Profile loaded! You can now edit the ${profileRightIds.length} rights before assigning.`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile details')
    }
  }

  // Handle profile selection for group editing - loads profile groups for editing
  const handleProfileSelectForGroupEditing = async (profileId: number | null) => {
    setSelectedProfile(profileId)
    
    if (!profileId) {
      setProfileGroups([])
      setEditableProfileGroups([])
      return
    }
    
    try {
      const profileDetails = await brokerProfileService.getProfileById(profileId)
      const profileGroupIds = profileDetails.groups.map(g => g.groupId)
      setProfileGroups(profileGroupIds)
      setEditableProfileGroups([...profileGroupIds])
      toast.success(`Profile loaded! You can now edit the ${profileGroupIds.length} groups before assigning.`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile details')
    }
  }

  // Toggle permission in editable role permissions
  const handleRolePermissionToggle = (permissionId: number) => {
    setEditableRolePermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  // Apply edited role permissions to broker
  const handleApplyRolePermissions = () => {
    setSelectedRights(editableRolePermissions)
    toast.success(`${editableRolePermissions.length} permissions from role applied to broker!`)
  }

  // Toggle group in editable profile groups
  const handleProfileGroupToggle = (groupId: number) => {
    setEditableProfileGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId)
      } else {
        return [...prev, groupId]
      }
    })
  }

  // Apply edited profile groups to broker
  const handleApplyProfileGroups = () => {
    setSelectedGroups(editableProfileGroups)
    toast.success(`${editableProfileGroups.length} groups from profile applied to broker!`)
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

              /* Clean form styling */
              .form-label {
                display: block;
                font-size: 11px;
                font-weight: 500;
                color: #000000;
                margin-bottom: 4px;
                letter-spacing: 0.01em;
              }
              
              .form-input {
                width: 100%;
                padding: 7px 10px;
                font-size: 13px;
                line-height: 1.4;
                color: #000000;
                background-color: #ffffff;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                transition: all 0.15s ease;
              }
              
              .form-input::placeholder {
                color: #9ca3af;
              }
              
              .form-input:hover {
                border-color: #9ca3af;
              }
              
              .form-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
              }
              
              .form-input-error {
                border-color: #ef4444;
                background-color: #fef2f2;
              }
              
              .form-error-text {
                margin-top: 3px;
                font-size: 10px;
                color: #ef4444;
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
              className="relative bg-white rounded-2xl shadow-2xl transform w-full max-w-3xl mx-4"
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
                      onClick={() => setActiveTab('account-mapping')}
                      className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'account-mapping'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Add Account Mapping
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profiles')}
                      className={`py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'profiles'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Assign Profile
                    </button>
                  </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'basic' && (
                      <motion.div
                        key="basic"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Clean Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                          <div>
                            <label className="form-label">Full Name *</label>
                            <input
                              type="text"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              className={`form-input ${errors.full_name ? 'form-input-error' : ''}`}
                              placeholder="Enter full name"
                              required
                            />
                            {errors.full_name && <p className="form-error-text">{errors.full_name}</p>}
                          </div>

                          <div>
                            <label className="form-label">Username *</label>
                            <input
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className={`form-input ${errors.username ? 'form-input-error' : ''}`}
                              placeholder="Enter username"
                              required
                            />
                            {errors.username && <p className="form-error-text">{errors.username}</p>}
                          </div>

                          <div>
                            <label className="form-label">Email *</label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                              placeholder="Enter email"
                              required
                            />
                            {errors.email && <p className="form-error-text">{errors.email}</p>}
                          </div>

                          <div>
                            <label className="form-label">Phone *</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                              placeholder="Enter phone"
                              required
                            />
                            {errors.phone && <p className="form-error-text">{errors.phone}</p>}
                          </div>

                          {!broker && (
                            <div>
                              <label className="form-label">Password *</label>
                              <input
                                type="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleInputChange}
                                className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                                placeholder="Enter password"
                                required
                              />
                              {errors.password && <p className="form-error-text">{errors.password}</p>}
                            </div>
                          )}

                          <div>
                            <label className="form-label">Account Range From *</label>
                            <input
                              type="number"
                              name="account_range_from"
                              value={formData.account_range_from}
                              onChange={handleInputChange}
                              className={`form-input ${errors.account_range_from ? 'form-input-error' : ''}`}
                              placeholder="1000"
                              required
                            />
                            {errors.account_range_from && <p className="form-error-text">{errors.account_range_from}</p>}
                          </div>

                          <div>
                            <label className="form-label">Account Range To *</label>
                            <input
                              type="number"
                              name="account_range_to"
                              value={formData.account_range_to}
                              onChange={handleInputChange}
                              className={`form-input ${errors.account_range_to ? 'form-input-error' : ''}`}
                              placeholder="2000"
                              required
                            />
                            {errors.account_range_to && <p className="form-error-text">{errors.account_range_to}</p>}
                          </div>

                          <div>
                            <label className="form-label">Credit Limit</label>
                            <input
                              type="number"
                              step="0.01"
                              name="credit_limit"
                              value={formData.credit_limit || ''}
                              onChange={handleInputChange}
                              className="form-input"
                              placeholder="Enter credit limit"
                            />
                          </div>

                          <div>
                            <label className="form-label">Default Percentage (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              name="default_percentage"
                              value={formData.default_percentage || ''}
                              onChange={handleInputChange}
                              className="form-input"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="form-label">Status</label>
                            <select 
                              name="is_active"
                              value={formData.is_active ? 'active' : 'inactive'}
                              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                              className="form-input"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>

                        </div>
                      </motion.div>
                    )}


                    {activeTab === 'profiles' && (
                      <motion.div
                        key="profiles"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className=""
                      >
                        {/* Header with Profile Dropdown */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Assign Profile</h3>
                            <p className="text-xs text-gray-600">Select a profile and customize its rights and groups before assigning to this broker.</p>
                          </div>
                          
                          {/* Profile Dropdown at top right */}
                          <div className="ml-4" style={{ minWidth: '200px' }}>
                            <select
                              value={selectedProfile || ''}
                              onChange={(e) => {
                                const profileId = e.target.value ? Number(e.target.value) : null
                                if (profileId) {
                                  handleProfileSelectForRoleEditing(profileId)
                                  handleProfileSelectForGroupEditing(profileId)
                                } else {
                                  setSelectedProfile(null)
                                  setEditableRolePermissions([])
                                  setEditableProfileGroups([])
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                              disabled={profilesLoading}
                            >
                              <option value="">-- Select Profile --</option>
                              {brokerProfiles?.profiles?.map((profile) => (
                                <option key={profile.id} value={profile.id}>
                                  {profile.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Profile Loading State */}
                        {profilesLoading && (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        )}

                        {/* No Profiles Message */}
                        {!profilesLoading && brokerProfiles?.profiles?.length === 0 && (
                          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm text-gray-500">No profiles available. Create profiles in the Broker Profiles section first.</p>
                          </div>
                        )}

                        {/* Show content when profile is selected */}
                        {selectedProfile && !profilesLoading && (
                          <div>
                            {/* Sub-tabs for Rights and Groups */}
                            <div className="border-b border-gray-200 mb-4">
                              <nav className="flex space-x-6">
                                <button
                                  type="button"
                                  onClick={() => setProfileSubTab('rights')}
                                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    profileSubTab === 'rights'
                                      ? 'border-blue-500 text-blue-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  Rights ({editableRolePermissions.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProfileSubTab('groups')}
                                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    profileSubTab === 'groups'
                                      ? 'border-blue-500 text-blue-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  Groups ({editableProfileGroups.length})
                                </button>
                              </nav>
                            </div>

                            {/* Rights Tab Content */}
                            {profileSubTab === 'rights' && (
                              <div>
                                {allRightsLoading ? (
                                  <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                  </div>
                                ) : allBrokerRights && allBrokerRights.length > 0 ? (
                                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="mb-2 pb-2 border-b border-gray-200">
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        Rights ({editableRolePermissions.length} selected)
                                      </h4>
                                    </div>
                                    <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
                                      {/* Group rights by category */}
                                      {Object.entries(
                                        allBrokerRights.reduce((acc, right) => {
                                          const category = right.category || 'Other'
                                          if (!acc[category]) acc[category] = []
                                          acc[category].push(right)
                                          return acc
                                        }, {} as Record<string, typeof allBrokerRights>)
                                      ).map(([category, categoryRights]) => (
                                        <div key={category} className="bg-gray-50 rounded-md p-2.5 border border-gray-200">
                                          <h5 className="font-semibold text-xs text-gray-800 mb-2 uppercase tracking-wide">{category}</h5>
                                          <div className="space-y-1">
                                            {categoryRights.map((right) => (
                                              <label 
                                                key={right.id} 
                                                className={`flex items-center cursor-pointer px-2 py-1.5 rounded-md transition-all ${
                                                  editableRolePermissions.includes(right.id) 
                                                    ? 'bg-blue-50 border border-blue-200' 
                                                    : 'bg-white border border-transparent hover:border-gray-300'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={editableRolePermissions.includes(right.id)}
                                                  onChange={() => handleRolePermissionToggle(right.id)}
                                                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className={`ml-2.5 text-xs ${
                                                  editableRolePermissions.includes(right.id) ? 'text-blue-900 font-medium' : 'text-gray-700'
                                                }`}>
                                                  {right.description || right.name}
                                                </span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500">No rights available.</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Groups Tab Content */}
                            {profileSubTab === 'groups' && (
                              <div>
                                {groupsLoading ? (
                                  <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                  </div>
                                ) : groupsData?.groups && groupsData.groups.length > 0 ? (
                                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="mb-2 pb-2 border-b border-gray-200">
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        Groups ({editableProfileGroups.length} selected)
                                      </h4>
                                    </div>
                                    <div className="space-y-1.5 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
                                      {groupsData.groups.map((group) => (
                                        <label 
                                          key={group.id} 
                                          className={`flex items-center cursor-pointer px-2.5 py-2 rounded-md border transition-all ${
                                            editableProfileGroups.includes(group.id) 
                                              ? 'bg-blue-50 border-blue-200' 
                                              : 'bg-white border-gray-200 hover:border-blue-300'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={editableProfileGroups.includes(group.id)}
                                            onChange={() => handleProfileGroupToggle(group.id)}
                                            className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                          />
                                          <div className="ml-2.5 flex-1">
                                            <div className={`text-xs font-semibold ${
                                              editableProfileGroups.includes(group.id) ? 'text-blue-900' : 'text-gray-900'
                                            }`}>
                                              {group.broker_view_group}
                                            </div>
                                            <div className="text-[11px] text-gray-600 mt-0.5 leading-tight">{group.mt5_group}</div>
                                          </div>
                                          <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                            group.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                          }`}>
                                            {group.is_active ? 'Active' : 'Inactive'}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500">No groups available.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Show message when no profile selected */}
                        {!selectedProfile && !profilesLoading && brokerProfiles?.profiles && brokerProfiles.profiles.length > 0 && (
                          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm text-gray-600 font-medium mb-1">No Profile Selected</p>
                            <p className="text-xs text-gray-500">Select a profile from the dropdown above to view and edit its rights and groups.</p>
                          </div>
                        )}
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
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Account Mappings</h3>
                            <p className="text-xs text-gray-600">Configure field mapping conditions for this broker.</p>
                          </div>
                          
                          {/* Match All Condition Toggle */}
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-700">Match All</span>
                            <button
                              type="button"
                              onClick={() => handleMatchAllConditionToggle()}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 ${
                                formData.match_all_condition === true ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  formData.match_all_condition === true ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">
                              {formData.match_all_condition === true ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>

                        {/* Loading state for account mappings */}
                        {accountMappingsLoading && broker?.id && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-medium text-gray-700">Loading Mappings...</h4>
                            </div>
                            <div className="space-y-2">
                              {[...Array(2)].map((_, i) => (
                                <div key={i} className="p-2.5 bg-gray-100 rounded-md animate-pulse">
                                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Existing Mappings List */}
                        {!accountMappingsLoading && accountMappings && accountMappings.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold text-gray-700">Current Mappings <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{accountMappings.length}</span></h4>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {accountMappings.filter(mapping => mapping && mapping.field_name).map((mapping) => (
                                <div key={mapping.id} className="flex items-center justify-between p-2.5 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                                  <div className="flex-1">
                                    <span className="text-xs text-gray-700">
                                      <strong className="text-blue-600">{mapping.field_name}</strong> 
                                      <span className="mx-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">{mapping.operator_type}</span> 
                                      <strong className="text-green-600">{mapping.field_value}</strong>
                                    </span>
                                    {mapping.created_at && (
                                      <div className="text-[10px] text-gray-500 mt-0.5">
                                        {new Date(mapping.created_at).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMapping(mapping.id)}
                                    disabled={deleteAccountMappingMutation.isLoading}
                                    className="ml-2 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                  >
                                    {deleteAccountMappingMutation.isLoading ? (
                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold text-gray-700">Pending <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">{pendingMappings.length}</span></h4>
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Saved with broker</span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {pendingMappings.map((mapping) => (
                                <div key={mapping.id} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-md border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all">
                                  <div className="flex-1">
                                    <span className="text-xs text-gray-700">
                                      <strong className="text-blue-600">{mapping.field_name}</strong> 
                                      <span className="mx-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">{mapping.operator_type}</span> 
                                      <strong className="text-green-600">{mapping.field_value}</strong>
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePendingMapping(mapping.id)}
                                    className="ml-2 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add New Mapping Form */}
                        <div className="border border-gray-200 rounded-lg p-3.5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold text-gray-800">Add New Mapping</h4>
                            <button
                              type="button"
                              onClick={broker?.id ? handleAccountMappingSubmit : handleAddPendingMapping}
                              disabled={createAccountMappingMutation.isLoading}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {createAccountMappingMutation.isLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  {broker?.id ? 'Add Mapping' : 'Add to Pending'}
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Field Name *
                              </label>
                              <select
                                name="field_name"
                                value={accountMappingData.field_name}
                                onChange={(e) => {
                                  const fieldName = e.target.value
                                  setAccountMappingData(prev => ({ 
                                    ...prev, 
                                    field_name: fieldName,
                                    // Auto-set appropriate operator based on field type
                                    operator_type: fieldName === 'Account' ? '=' : 'LIKE'
                                  }))
                                  if (accountMappingErrors.field_name) {
                                    setAccountMappingErrors(prev => ({ ...prev, field_name: '' }))
                                  }
                                }}
                                className={`w-full px-2.5 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                  accountMappingErrors.field_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                              >
                                <option value="">-- Select Field --</option>
                                <optgroup label="Numeric Fields">
                                  <option value="Account">Account</option>
                                </optgroup>
                                <optgroup label="Text Fields">
                                  <option value="Group">Group</option>
                                  <option value="Name">Name</option>
                                  <option value="LastName">Last Name</option>
                                  <option value="MiddleName">Middle Name</option>
                                  <option value="Email">Email</option>
                                  <option value="Phone">Phone</option>
                                  <option value="Company">Company</option>
                                  <option value="Status">Status</option>
                                  <option value="LeadCampaign">Lead Campaign</option>
                                  <option value="LeadSource">Lead Source</option>
                                  <option value="Country">Country</option>
                                  <option value="State">State</option>
                                  <option value="City">City</option>
                                  <option value="ZipCode">Zip Code</option>
                                  <option value="Address">Address</option>
                                  <option value="Comment">Comment</option>
                                </optgroup>
                              </select>
                              {accountMappingErrors.field_name && (
                                <p className="mt-1 text-[10px] text-red-600">{accountMappingErrors.field_name}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Operator Type
                              </label>
                              <select
                                name="operator_type"
                                value={accountMappingData.operator_type}
                                onChange={(e) => setAccountMappingData(prev => ({ ...prev, operator_type: e.target.value }))}
                                className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!accountMappingData.field_name}
                              >
                                {/* Account field operators */}
                                {accountMappingData.field_name === 'Account' && (
                                  <>
                                    <option value="=">=</option>
                                    <option value="IN">IN</option>
                                    <option value="Range">Range</option>
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value=">=">&gt;=</option>
                                    <option value="<=">&lt;=</option>
                                  </>
                                )}
                                {/* Text field operators (including Group) */}
                                {accountMappingData.field_name && accountMappingData.field_name !== 'Account' && (
                                  <>
                                    <option value="LIKE">LIKE</option>
                                    <option value="STARTS_WITH">STARTS_WITH</option>
                                    <option value="CONTAINS">CONTAINS</option>
                                    <option value="ENDS_WITH">ENDS_WITH</option>
                                    <option value="NOT_CONTAINS">NOT_CONTAINS</option>
                                    <option value="=">=</option>
                                  </>
                                )}
                                {/* Default when no field selected */}
                                {!accountMappingData.field_name && (
                                  <option value="">Select field first</option>
                                )}
                              </select>
                            </div>

                            <div className="relative">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Field Value *
                              </label>
                              <input
                                type="text"
                                name="field_value"
                                value={accountMappingData.field_value}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setAccountMappingData(prev => ({ ...prev, field_value: value }))
                                  if (accountMappingErrors.field_value) {
                                    setAccountMappingErrors(prev => ({ ...prev, field_value: '' }))
                                  }
                                  // Fetch suggestions for searchable fields
                                  if (['Name', 'LastName', 'MiddleName', 'Email', 'Account'].includes(accountMappingData.field_name)) {
                                    if (value.length > 0) {
                                      fetchMT5Suggestions(accountMappingData.field_name, value)
                                    }
                                  }
                                  setShowSuggestions(true)
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className={`w-full px-2.5 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                  accountMappingErrors.field_value ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder={accountMappingData.field_name ? `Select or type ${accountMappingData.field_name.toLowerCase()}` : "Select field first"}
                                disabled={!accountMappingData.field_name}
                                autoComplete="off"
                              />
                              {accountMappingErrors.field_value && (
                                <p className="mt-1 text-[10px] text-red-600">{accountMappingErrors.field_value}</p>
                              )}
                              
                              {/* Suggestions Dropdown */}
                              {showSuggestions && mt5Suggestions.length > 0 && accountMappingData.field_name && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {mt5Suggestions.map((suggestion, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        setAccountMappingData(prev => ({ ...prev, field_value: suggestion }))
                                        setShowSuggestions(false)
                                      }}
                                      className="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                      <span className="text-gray-700">{suggestion}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Field Reference Table */}
                          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-1.5 border-b border-gray-200">
                              <h5 className="text-[10px] font-semibold text-gray-800 uppercase tracking-wide">Available Fields & Operators</h5>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200">Field</th>
                                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200">Operators</th>
                                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 border-b border-gray-200">Example Values</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="px-2 py-1.5 text-gray-700 font-medium">Account</td>
                                    <td className="px-2 py-1.5 text-gray-600">=, &lt;, &gt;, &gt;=, &lt;=, IN, Range</td>
                                    <td className="px-2 py-1.5 text-gray-600">1234, 1234-2000, 1234,4343,2144</td>
                                  </tr>
                                  <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="px-2 py-1.5 text-gray-700 font-medium">Group</td>
                                    <td className="px-2 py-1.5 text-gray-600">=</td>
                                    <td className="px-2 py-1.5 text-gray-600">Aamir</td>
                                  </tr>
                                  <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="px-2 py-1.5 text-gray-700 font-medium">Name, Email, Phone, etc.</td>
                                    <td className="px-2 py-1.5 text-gray-600">LIKE, STARTS_WITH, CONTAINS, ENDS_WITH, NOT_CONTAINS</td>
                                    <td className="px-2 py-1.5 text-gray-600">Aam%, Aam, ami, mir, am</td>
                                  </tr>
                                  <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="px-2 py-1.5 text-gray-700 font-medium" colSpan={3}>
                                      <div className="flex flex-wrap gap-1">
                                        <span className="text-gray-500">Text Fields:</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">LastName</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">MiddleName</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">Company</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">Status</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">LeadCampaign</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">LeadSource</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">Country</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">State</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">City</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">ZipCode</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">Address</span>
                                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">Comment</span>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
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
                      className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      disabled={isLoading}
                    >
                      Cancel
                    </motion.button>
                    {activeTab === 'account-mapping' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className="px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        disabled={isLoading}
                      >
                        Back to Basic Info
                      </motion.button>
                    )}
                    {activeTab === 'profiles' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setActiveTab('account-mapping')}
                        className="px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        disabled={isLoading}
                      >
                        Back to Account Mapping
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
                            setActiveTab('account-mapping')
                          }
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center"
                      >
                        Next: Account Mapping
                        <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    ) : activeTab === 'account-mapping' ? (
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setActiveTab('profiles')}
                          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center"
                        >
                          Next: Assign Profile
                          <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                          disabled={isLoading || syncRightsMutation.isLoading}
                        >
                          {isLoading || syncRightsMutation.isLoading ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {broker ? 'Updating...' : 'Creating...'}
                            </div>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                        disabled={isLoading || syncRightsMutation.isLoading}
                      >
                        {isLoading || syncRightsMutation.isLoading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {broker ? 'Updating...' : 'Creating...'}
                          </div>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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