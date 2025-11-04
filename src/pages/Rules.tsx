import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { ruleService } from '../services/ruleService'
import { Rule, CreateRuleData, UpdateRuleData } from '../types'
import RuleTable from '../components/RuleTable'
import RuleModal from '../components/RuleModal'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import toast from 'react-hot-toast'
import { PermissionGate } from '../components/PermissionGate'
import { MODULES } from '../utils/permissions'

const Rules: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null)
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Fetch rules
  const { data: rulesData, isLoading, refetch } = useQuery(
    ['rules', showActiveOnly],
    () => ruleService.getRules(showActiveOnly),
    {
      onError: (error: any) => {
        if (error.response?.status === 403) {
          setAccessDenied(true)
        } else {
          toast.error(error.response?.data?.message || 'Failed to fetch rules')
        }
      },
    }
  )

  // Create rule mutation
  const createRuleMutation = useMutation(
    (data: CreateRuleData) => ruleService.createRule(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        setIsModalOpen(false)
        setSelectedRule(null)
        setApiError(null)
        toast.success('Rule created successfully')
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create rule'
        setApiError(errorMessage)
        // Still show toast for general notification
        toast.error(errorMessage)
      },
    }
  )

  // Update rule mutation
  const updateRuleMutation = useMutation(
    ({ id, data }: { id: number; data: UpdateRuleData }) => ruleService.updateRule(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        setIsModalOpen(false)
        setSelectedRule(null)
        setApiError(null)
        toast.success('Rule updated successfully')
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update rule'
        setApiError(errorMessage)
        toast.error(errorMessage)
      },
    }
  )

  // Delete rule mutation
  const deleteRuleMutation = useMutation(
    (id: number) => ruleService.deleteRule(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        setRuleToDelete(null)
        toast.success('Rule deleted successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete rule')
      },
    }
  )

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    (rule: Rule) => ruleService.toggleRuleStatus(rule),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rules')
        toast.success('Rule status updated')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update rule status')
      },
    }
  )

  const handleCreateRule = () => {
    setSelectedRule(null)
    setApiError(null)
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: Rule) => {
    setSelectedRule(rule)
    setApiError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRule(null)
    setApiError(null)
  }

  const handleDeleteRule = (id: number) => {
    setRuleToDelete(id)
  }

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRuleMutation.mutate(ruleToDelete)
    }
  }

  const handleToggleStatus = (rule: Rule) => {
    toggleStatusMutation.mutate(rule)
  }

  const handleSubmit = (data: CreateRuleData | UpdateRuleData) => {
    if (selectedRule) {
      updateRuleMutation.mutate({ id: selectedRule.id, data })
    } else {
      createRuleMutation.mutate(data as CreateRuleData)
    }
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Rules refreshed')
  }

  const rules = rulesData?.rules || []
  const totalCount = rulesData?.count || 0

  // Access Denied UI
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 flex justify-center">
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access rule definitions.
            <br />
            This module requires the <span className="font-semibold text-gray-900">rules.view</span> permission.
            <br />
            Please contact your administrator to request access.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="px-6 pt-6">
        <header className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Rule Definitions</h1>
                  <p className="text-sm text-gray-500">
                    Manage trading rules and MT5 configurations ({totalCount} rules)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Active Only Filter */}
                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span>Active Only</span>
                </label>

                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-1.5 font-semibold text-xs group disabled:opacity-50"
                >
                  <ArrowPathIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Refresh</span>
                </button>

                <PermissionGate module={MODULES.RULES} action="create">
                  <button
                    onClick={handleCreateRule}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold text-xs group"
                  >
                    <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Create Rule</span>
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="px-6 py-6">
        <RuleTable
          rules={rules}
          isLoading={isLoading}
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          onToggleStatus={handleToggleStatus}
        />
      </main>

      {/* Modals */}
      <RuleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        rule={selectedRule}
        isLoading={createRuleMutation.isLoading || updateRuleMutation.isLoading}
        apiError={apiError}
      />

      <ConfirmationDialog
        isOpen={ruleToDelete !== null}
        onClose={() => setRuleToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Rule"
        message="Are you sure you want to delete this rule? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteRuleMutation.isLoading}
      />
    </div>
  )
}

export default Rules

