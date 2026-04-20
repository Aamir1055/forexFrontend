import api from './api'
import { ApiResponse } from '../types'

export interface BrokerGroupMapping {
  id: number
  group_id: number
  created_at: string
}

export interface GroupMappingsResponse {
  group_mappings: BrokerGroupMapping[]
}

export interface SyncResult {
  added: number
  removed: number
  skipped: number
  hasConflicts: boolean
}

export const brokerGroupMappingService = {
  // Get broker's group mappings
  async getBrokerGroupMappings(brokerId: number): Promise<BrokerGroupMapping[]> {
    console.log(`🔍 Fetching group mappings for broker ${brokerId}`)
    const response = await api.get<ApiResponse<GroupMappingsResponse>>(`/api/brokers/${brokerId}/group-mappings`)
    console.log(`📦 Received ${response.data.data.group_mappings.length} group mappings:`, response.data.data.group_mappings)
    return response.data.data.group_mappings
  },

  // Assign a group to broker
  async assignGroup(brokerId: number, groupId: number): Promise<BrokerGroupMapping> {
    const response = await api.post<ApiResponse<BrokerGroupMapping>>(
      `/api/brokers/${brokerId}/group-mappings`,
      { group_id: groupId }
    )
    return response.data.data
  },

  // Remove group from broker
  async removeGroup(brokerId: number, mappingId: number): Promise<void> {
    await api.delete(`/api/brokers/${brokerId}/group-mappings/${mappingId}`)
  },

  // Sync all groups for a broker (replace existing with new set)
  async syncBrokerGroups(brokerId: number, groupIds: number[]): Promise<SyncResult> {
    // First, get existing mappings - fetch fresh from API to avoid stale data
    console.log(`🔄 Fetching current groups for broker ${brokerId}...`)
    const existing = await this.getBrokerGroupMappings(brokerId)
    const existingGroupIds = existing.map(m => m.group_id)
    
    // Determine which groups to remove and which to add
    const toRemove = existing.filter(m => !groupIds.includes(m.group_id))
    const toAdd = groupIds.filter(id => !existingGroupIds.includes(id))
    
    console.log(`Syncing groups for broker ${brokerId}:`, {
      existing: existingGroupIds,
      existingCount: existing.length,
      requested: groupIds,
      requestedCount: groupIds.length,
      toRemove: toRemove.map(m => m.group_id),
      toRemoveCount: toRemove.length,
      toAdd,
      toAddCount: toAdd.length
    })
    
    // If nothing to change, skip
    if (toRemove.length === 0 && toAdd.length === 0) {
      console.log(`✅ No changes needed for broker ${brokerId}`)
      return { added: 0, removed: 0, skipped: 0, hasConflicts: false }
    }
    
    let removedCount = 0
    let addedCount = 0
    let skippedCount = 0
    
    // Delete mappings that are no longer needed
    for (const mapping of toRemove) {
      try {
        await this.removeGroup(brokerId, mapping.id)
        removedCount++
        console.log(`✅ Removed group ${mapping.group_id} (mapping ${mapping.id})`)
      } catch (error) {
        console.error(`❌ Failed to remove group mapping ${mapping.id}:`, error)
        // Continue even if deletion fails
      }
    }
    
    // Add new mappings (only groups that don't already exist)
    for (const groupId of toAdd) {
      try {
        await this.assignGroup(brokerId, groupId)
        addedCount++
        console.log(`✅ Added group ${groupId}`)
      } catch (error: any) {
        // Skip if already exists (409), otherwise throw
        if (error.response?.status === 409) {
          skippedCount++
          console.warn(`⚠️ Group ${groupId} already exists in backend but wasn't in API response - skipping`)
        } else {
          console.error(`❌ Failed to assign group ${groupId}:`, error)
          throw error
        }
      }
    }
    
    const hasConflicts = skippedCount > 0
    console.log(`✅ Group sync completed for broker ${brokerId}: ${addedCount} added, ${removedCount} removed, ${skippedCount} skipped (409)`)
    
    return { added: addedCount, removed: removedCount, skipped: skippedCount, hasConflicts }
  }
}

