import api from './api'
import { generateBillPdf, findUserInBillsResponse, BillPdfMeta } from '../utils/billPdf'

// ─── Types ───────────────────────────────────────────────────────────
export interface SettlementWeek {
  id: number
  week_number?: number
  name?: string
  start_date: string
  end_date: string
  start_day?: string
  end_day?: string
  is_current?: boolean
  is_active?: boolean
  [key: string]: any
}

export interface BillRow {
  login: number | string
  name: string
  total_brokerage: number
  total_gross: number
  total_net: number
  [key: string]: any
}

export interface BillsSummaryResponse {
  totals: {
    total_brokerage: number
    total_gross: number
    total_net: number
  }
  items: BillRow[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  settlement_week?: SettlementWeek
  raw?: any
}

export interface BillsRequestPayload {
  week_id: number
  page?: number
  limit?: number
  search?: string
  mt5Accounts?: Array<string | number>
  sortBy?: 'brokerage' | 'gross' | 'net' | 'login' | 'name'
  sortOrder?: 'asc' | 'desc'
}

// ─── Helpers ────────────────────────────────────────────────────────
const toNumber = (v: any): number => {
  if (v === null || v === undefined || v === '') return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

// Settlement weeks endpoint returns an array directly OR wrapped in
// `{ data: [...] }` depending on backend. Handle both.
const findWeeksArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const keys = ['weeks', 'settlement_weeks', 'items', 'results', 'data']
  for (const k of keys) {
    if (Array.isArray(payload[k])) return payload[k]
  }
  return []
}

export const billsService = {
  // ── Settlement weeks ───────────────────────────────────────────────
  async getSettlementWeeks(): Promise<SettlementWeek[]> {
    const res = await api.get('/api/settlement-weeks')
    // Try outer payload first, then inner `data`
    let list = findWeeksArray(res.data)
    if (list.length === 0 && res.data?.data) {
      list = findWeeksArray(res.data.data)
    }
    return list as SettlementWeek[]
  },

  async getSettlementWeek(weekId: number): Promise<SettlementWeek> {
    const res = await api.get(`/api/settlement-weeks/${weekId}`)
    const root = res.data?.data ?? res.data
    return (root?.week ?? root?.settlement_week ?? root) as SettlementWeek
  },

  // ── Bills summary (returns KPI totals + items list + pagination) ───
  async getSummary(
    brokerId: number,
    payload: BillsRequestPayload
  ): Promise<BillsSummaryResponse> {
    const res = await api.post(
      `/api/admin/brokers/${brokerId}/bills/summary`,
      payload
    )
    // eslint-disable-next-line no-console
    console.log('[billsService] summary raw response:', res.data)
    const root = res.data?.data ?? res.data ?? {}
    const totalsRaw = root.totals ?? {}

    // Try the well-known keys first, then fall back to ANY array at root
    // (excluding settlement_week which is an object).
    let items: any[] = []
    const tryKeys = ['items', 'rows', 'bills', 'Bills', 'Items', 'data', 'results', 'records', 'list']
    for (const k of tryKeys) {
      if (Array.isArray(root[k])) {
        items = root[k]
        break
      }
    }
    if (items.length === 0) {
      for (const k of Object.keys(root)) {
        if (Array.isArray(root[k]) && root[k].length > 0 && typeof root[k][0] === 'object') {
          // eslint-disable-next-line no-console
          console.log(`[billsService] using array under key "${k}" for items`)
          items = root[k]
          break
        }
      }
    }
    const pagination = root.pagination ?? {}

    const rows: BillRow[] = items.map((r: any) => ({
      login: r.Login ?? r.login ?? r.mt5_login ?? '',
      name: r.Name ?? r.name ?? r.full_name ?? '',
      total_brokerage: toNumber(r.TotalBrokerage ?? r.total_brokerage),
      total_gross: toNumber(r.TotalGrossAmount ?? r.total_gross),
      total_net: toNumber(r.TotalNetAmount ?? r.total_net),
      ...r,
    }))

    return {
      totals: {
        total_brokerage: toNumber(
          totalsRaw.TotalBrokerage ?? totalsRaw.total_brokerage
        ),
        total_gross: toNumber(
          totalsRaw.TotalGrossAmount ?? totalsRaw.total_gross
        ),
        total_net: toNumber(totalsRaw.TotalNetAmount ?? totalsRaw.total_net),
      },
      items: rows,
      pagination: {
        page: Number(pagination.page ?? payload.page ?? 1),
        limit: Number(pagination.limit ?? payload.limit ?? rows.length),
        total: Number(pagination.total ?? rows.length),
        total_pages: Number(
          pagination.total_pages ?? pagination.pages ?? 1
        ),
      },
      settlement_week: root.SettlementWeek ?? root.settlement_week,
      raw: root,
    }
  },

  // ── Per-user detailed bill (used to render/download a PDF) ─────────
  // POST /api/admin/brokers/{brokerId}/bills with the login filter.
  async getBillDetail(
    brokerId: number,
    weekId: number,
    login: number | string,
    extra: Record<string, any> = {}
  ): Promise<any> {
    const res = await api.post(`/api/admin/brokers/${brokerId}/bills`, {
      week_id: weekId,
      logins: [Number(login)],
      ...extra,
    })
    return res.data?.data ?? res.data
  },

  // ── Download a single bill PDF (generated client-side) ─────────────
  async downloadBillPdf(
    brokerId: number,
    weekId: number,
    login: number | string,
    meta: BillPdfMeta = {}
  ): Promise<Blob> {
    const res = await api.post(`/api/admin/brokers/${brokerId}/bills`, {
      week_id: weekId,
      logins: [Number(login)],
    })
    const user = findUserInBillsResponse(res.data, login)
    if (!user) {
      throw new Error(`No bill data returned for login ${login}`)
    }
    const sw = res.data?.data?.SettlementWeek ?? res.data?.SettlementWeek
    return generateBillPdf(user, {
      ...meta,
      weekName: meta.weekName ?? sw?.name,
      weekStart: meta.weekStart ?? sw?.start_date,
      weekEnd: meta.weekEnd ?? sw?.end_date,
    })
  },
}

export default billsService
