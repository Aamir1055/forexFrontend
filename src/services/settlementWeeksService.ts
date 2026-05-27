import api from './api'
import type { SettlementWeek } from './billsService'

export type { SettlementWeek }

export interface CreateSettlementWeekData {
  name: string
  start_date: string
  end_date: string
  week_number?: number
  is_active?: boolean
  is_current?: boolean
}

export type UpdateSettlementWeekData = Partial<CreateSettlementWeekData>

// The list endpoint may return the array directly, or wrapped in
// `{ data: [...] }` / `{ weeks: [...] }`. Handle every reasonable shape.
const extractList = (payload: any): SettlementWeek[] => {
  if (Array.isArray(payload)) return payload as SettlementWeek[]
  if (!payload || typeof payload !== 'object') return []
  const keys = ['weeks', 'settlement_weeks', 'items', 'results', 'data', 'rows']
  for (const k of keys) {
    if (Array.isArray(payload[k])) return payload[k] as SettlementWeek[]
  }
  // Fall back to first array property at the root
  for (const k of Object.keys(payload)) {
    if (Array.isArray(payload[k])) return payload[k] as SettlementWeek[]
  }
  return []
}

const extractOne = (payload: any): SettlementWeek => {
  const root = payload?.data ?? payload
  return (root?.week ?? root?.settlement_week ?? root) as SettlementWeek
}

export const settlementWeeksService = {
  // ── GET /api/settlement-weeks ──────────────────────────────────────
  async list(): Promise<SettlementWeek[]> {
    const res = await api.get('/api/settlement-weeks')
    let list = extractList(res.data)
    if (list.length === 0 && res.data?.data) list = extractList(res.data.data)
    return list
  },

  // ── GET /api/settlement-weeks/:id ──────────────────────────────────
  async getById(id: number): Promise<SettlementWeek> {
    const res = await api.get(`/api/settlement-weeks/${id}`)
    return extractOne(res.data)
  },

  // ── POST /api/settlement-weeks ─────────────────────────────────────
  async create(data: CreateSettlementWeekData): Promise<SettlementWeek> {
    const res = await api.post('/api/settlement-weeks', data)
    return extractOne(res.data)
  },

  // ── PUT /api/settlement-weeks/:id ──────────────────────────────────
  async update(id: number, data: UpdateSettlementWeekData): Promise<SettlementWeek> {
    const res = await api.put(`/api/settlement-weeks/${id}`, data)
    return extractOne(res.data)
  },

  // ── DELETE /api/settlement-weeks/:id ───────────────────────────────
  async remove(id: number): Promise<void> {
    await api.delete(`/api/settlement-weeks/${id}`)
  },
}

export default settlementWeeksService
