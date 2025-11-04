import api from './api'

export interface MT5Suggestion {
  field: string
  suggestions: string[]
  total: number
}

export interface MT5SuggestionResponse {
  data: MT5Suggestion
  status: string
}

class MT5SuggestionsService {
  async getSuggestions(field: string, query?: string, limit?: number): Promise<string[]> {
    try {
      const params: any = { field }
      if (query) params.query = query
      if (limit) params.limit = limit

      const response = await api.get('/api/mt5/suggestions', { params })
      
      // Check if response is valid JSON (not HTML)
      if (typeof response.data === 'string') {
        return []
      }
      
      // Handle successful response structure: { data: { field, suggestions, total }, status }
      if (response.data && response.data.status === 'success' && response.data.data) {
        const suggestions = response.data.data.suggestions
        if (Array.isArray(suggestions)) {
          return suggestions
        }
      }
      
      return []
    } catch (error: any) {
      // Silently fail if API is not available - form still works with manual input
      return []
    }
  }

  // Field-specific methods for better type safety
  async getGroupSuggestions(): Promise<string[]> {
    return this.getSuggestions('group')
  }

  async getLoginSuggestions(query?: string): Promise<string[]> {
    return this.getSuggestions('login', query)
  }

  async getCountrySuggestions(limit?: number): Promise<string[]> {
    return this.getSuggestions('country', undefined, limit)
  }

  async getEmailSuggestions(query?: string): Promise<string[]> {
    return this.getSuggestions('email', query)
  }

  async getCitySuggestions(): Promise<string[]> {
    return this.getSuggestions('city')
  }

  async getStateSuggestions(): Promise<string[]> {
    return this.getSuggestions('state')
  }

  async getStatusSuggestions(): Promise<string[]> {
    return this.getSuggestions('status')
  }

  async getCompanySuggestions(): Promise<string[]> {
    return this.getSuggestions('company')
  }

  async getCurrencySuggestions(): Promise<string[]> {
    return this.getSuggestions('currency')
  }

  async getLeverageSuggestions(): Promise<string[]> {
    return this.getSuggestions('leverage')
  }

  async getNameSuggestions(query?: string): Promise<string[]> {
    return this.getSuggestions('name', query)
  }

  async getLeadSourceSuggestions(): Promise<string[]> {
    return this.getSuggestions('leadSource')
  }

  async getLeadCampaignSuggestions(): Promise<string[]> {
    return this.getSuggestions('leadCampaign')
  }
}

export const mt5SuggestionsService = new MT5SuggestionsService()

