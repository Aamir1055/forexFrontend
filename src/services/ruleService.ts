import api from './api'
import { Rule, CreateRuleData, UpdateRuleData } from '../types'

export interface GetRulesResponse {
  count: number
  rules: Rule[]
}

export const ruleService = {
  // Get all rules
  getRules: async (activeOnly: boolean = false): Promise<GetRulesResponse> => {
    const params = activeOnly ? { active_only: 'true' } : {}
    const response = await api.get<GetRulesResponse>('/api/rules', { params })
    return response.data
  },

  // Get rule by code
  getRuleByCode: async (ruleCode: string): Promise<Rule> => {
    const response = await api.get<Rule>(`/api/rules/${ruleCode}`)
    return response.data
  },

  // Get rule by ID
  getRuleById: async (ruleId: number): Promise<Rule> => {
    const response = await api.get<Rule>(`/api/rules/${ruleId}`)
    return response.data
  },

  // Create new rule
  createRule: async (data: CreateRuleData): Promise<Rule> => {
    const response = await api.post<{ message: string; rule: Rule }>('/api/rules', data)
    return response.data.rule
  },

  // Update rule
  updateRule: async (ruleId: number, data: UpdateRuleData): Promise<Rule> => {
    const response = await api.put<{ message: string; rule: Rule }>(`/api/rules/${ruleId}`, data)
    return response.data.rule
  },

  // Delete rule (soft delete)
  deleteRule: async (ruleId: number): Promise<void> => {
    await api.delete<{ message: string; rule_id: number }>(`/api/rules/${ruleId}`)
  },

  // Toggle rule status (takes current rule object to avoid extra API call)
  toggleRuleStatus: async (rule: Rule): Promise<Rule> => {
    const response = await api.put<{ message: string; rule: Rule }>(`/api/rules/${rule.id}`, {
      is_active: !rule.is_active
    })
    return response.data.rule
  },
}
