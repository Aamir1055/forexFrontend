import jsPDF from 'jspdf'
import autoTable, { RowInput, CellHookData } from 'jspdf-autotable'

// ─── Types ─────────────────────────────────────────────────────────
export interface SymbolBreakdown {
  Symbol: string
  BUY?: Array<{
    Brokerage: number
    Datetime: string
    PnL: number
    Price: number
    Quantity: number
  }>
  SELL?: Array<{
    Brokerage: number
    Datetime: string
    PnL: number
    Price: number
    Quantity: number
  }>
  TotalBrokerage?: number
  TotalBuy?: number
  TotalBuyBrokerage?: number
  TotalBuyPnL?: number
  TotalGrossAmount?: number
  TotalNetAmount?: number
  TotalSell?: number
  TotalSellBrokerage?: number
  TotalSellPnL?: number
  [key: string]: any
}

export interface UserBillDetail {
  login?: number | string
  Login?: number | string
  name?: string
  Name?: string
  TotalBrokerage?: number
  TotalGrossAmount?: number
  TotalNetAmount?: number
  [key: string]: any
}

export interface BillPdfMeta {
  brokerName?: string
  weekName?: string
  weekStart?: string
  weekEnd?: string
}

// ─── Colors ────────────────────────────────────────────────────────
const NAVY: [number, number, number] = [30, 58, 95]
const WHITE: [number, number, number] = [255, 255, 255]
const BUY_BG: [number, number, number] = [217, 234, 211]
const SELL_BG: [number, number, number] = [234, 209, 220]
const BORDER: [number, number, number] = [180, 180, 180]
const RED: [number, number, number] = [192, 0, 0]
const TEXT: [number, number, number] = [20, 20, 20]

// ─── Helpers ───────────────────────────────────────────────────────
const fmt = (n: any): string => {
  const v = typeof n === 'number' ? n : parseFloat(String(n ?? 0))
  if (!Number.isFinite(v)) return '0.00'
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

const fmtDateCell = (s: string): string => {
  if (!s) return ''
  const m = String(s).match(
    /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  )
  if (m) return `${m[3]}/${m[2]}/${m[1]}\n${m[4]}:${m[5]}:${m[6]}`
  return String(s)
}

const findSymbolArray = (user: UserBillDetail): SymbolBreakdown[] => {
  for (const k of Object.keys(user)) {
    const v = (user as any)[k]
    if (
      Array.isArray(v) &&
      v.length > 0 &&
      v[0] &&
      typeof v[0] === 'object' &&
      'Symbol' in v[0]
    ) {
      return v as SymbolBreakdown[]
    }
  }
  return []
}

const stamp = (): string => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const mo = months[d.getMonth()]
  const yy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${dd}-${mo}-${yy} ${hh}:${mm}:${ss}`
}

// ─── Main ──────────────────────────────────────────────────────────
export const generateBillPdf = (
  user: UserBillDetail,
  meta: BillPdfMeta = {}
): Blob => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const login = user.Login ?? user.login ?? ''
  const name = user.Name ?? user.name ?? ''

  // ── Title row
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...TEXT)
  doc.text(`BILL OF ${login}`, pageWidth / 2, y + 8, { align: 'center' })
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.6)
  doc.line(margin, y + 22, pageWidth - margin, y + 22)
  doc.line(margin, y + 28, pageWidth - margin, y + 28)

  // Timestamp under title (right-aligned)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(stamp(), pageWidth - margin, y + 50, { align: 'right' })

  // Account name (left-aligned, same row as timestamp)
  if (name) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT)
    doc.text(`Name: ${String(name)}`, margin, y + 50)
  }
  y += 70

  // ── SUMMARY box (centered)
  const summaryWidth = Math.min(360, contentWidth * 0.65)
  const summaryLeft = (pageWidth - summaryWidth) / 2
  autoTable(doc, {
    startY: y,
    head: [
      [{ content: 'SUMMARY', colSpan: 3, styles: { halign: 'center' } }],
      ['Gross Amount', 'Brokrage', 'Net Amount'],
    ],
    body: [
      [
        fmt(user.TotalGrossAmount),
        fmt(user.TotalBrokerage),
        fmt(user.TotalNetAmount),
      ],
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      halign: 'center',
      lineColor: BORDER,
      lineWidth: 0.4,
      textColor: TEXT,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
    },
    bodyStyles: { fontStyle: 'bold' },
    tableWidth: summaryWidth,
    margin: { left: summaryLeft, right: summaryLeft },
  })
  y = (doc as any).lastAutoTable.finalY + 18

  // ── Per-symbol blocks
  const symbols = findSymbolArray(user)
  if (symbols.length === 0) {
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(
      'No trade details available for this period.',
      pageWidth / 2,
      y + 10,
      { align: 'center' }
    )
  } else {
    symbols.forEach((sym) => {
      y = renderSymbolBlock(doc, sym, y, margin, contentWidth)
      y += 14
    })
  }

  return doc.output('blob')
}

// ─── Per-symbol table renderer ──────────────────────────────────────
const renderSymbolBlock = (
  doc: jsPDF,
  sym: SymbolBreakdown,
  startY: number,
  margin: number,
  contentWidth: number
): number => {
  const buys = sym.BUY ?? []
  const sells = sym.SELL ?? []
  const rowCount = Math.max(buys.length, sells.length)

  const body: RowInput[] = []
  for (let i = 0; i < rowCount; i++) {
    const b = buys[i]
    const s = sells[i]
    body.push([
      b ? fmtDateCell(b.Datetime) : '',
      b ? fmt(b.Price) : '',
      b ? fmt(b.Quantity) : '',
      b ? fmt(b.Brokerage) : '',
      b ? fmt(b.PnL) : '',
      s ? fmtDateCell(s.Datetime) : '',
      s ? fmt(s.Price) : '',
      s ? fmt(s.Quantity) : '',
      s ? fmt(s.Brokerage) : '',
      s ? fmt(s.PnL) : '',
    ])
  }

  // Per-side totals row (Total label spans Date+Price)
  body.push([
    { content: 'Total', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: fmt(sym.TotalBuy), styles: { fontStyle: 'bold' } },
    { content: fmt(sym.TotalBuyBrokerage), styles: { fontStyle: 'bold' } },
    { content: fmt(sym.TotalBuyPnL), styles: { fontStyle: 'bold' } },
    { content: 'Total', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: fmt(sym.TotalSell), styles: { fontStyle: 'bold' } },
    { content: fmt(sym.TotalSellBrokerage), styles: { fontStyle: 'bold' } },
    { content: fmt(sym.TotalSellPnL), styles: { fontStyle: 'bold' } },
  ])

  // Footer summary rows
  const gross = Number(sym.TotalGrossAmount ?? 0)
  const net = Number(sym.TotalNetAmount ?? 0)
  const brokerage = Number(sym.TotalBrokerage ?? 0)
  const grossStatus = gross === 0 ? '-' : gross >= 0 ? 'Profit' : 'Loss'
  const netStatus = net === 0 ? '-' : net >= 0 ? 'Profit' : 'Loss'
  const redStyle = { textColor: RED as any, fontStyle: 'bold' as const }

  body.push([
    { content: 'Total Gross Amount', colSpan: 8, styles: { ...redStyle, halign: 'center' } },
    { content: grossStatus, styles: { ...redStyle, halign: 'center' } },
    { content: fmt(gross), styles: { ...redStyle, halign: 'right' } },
  ])
  body.push([
    { content: 'Total Brokrage', colSpan: 8, styles: { ...redStyle, halign: 'center' } },
    { content: '-', styles: { ...redStyle, halign: 'center' } },
    { content: fmt(brokerage), styles: { ...redStyle, halign: 'right' } },
  ])
  body.push([
    { content: 'Total Net Amount', colSpan: 8, styles: { ...redStyle, halign: 'center' } },
    { content: netStatus, styles: { ...redStyle, halign: 'center' } },
    { content: fmt(net), styles: { ...redStyle, halign: 'right' } },
  ])

  const colW = contentWidth / 10

  if (startY > doc.internal.pageSize.getHeight() - 160) {
    doc.addPage()
    startY = 36
  }

  autoTable(doc, {
    startY,
    head: [
      [
        {
          content: sym.Symbol,
          colSpan: 10,
          styles: {
            fillColor: NAVY,
            textColor: WHITE,
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 11,
          },
        },
      ],
      [
        {
          content: 'Buy',
          colSpan: 5,
          styles: {
            fillColor: BUY_BG,
            textColor: [34, 102, 51] as any,
            halign: 'center',
            fontStyle: 'bold',
          },
        },
        {
          content: 'Sell',
          colSpan: 5,
          styles: {
            fillColor: SELL_BG,
            textColor: [142, 27, 27] as any,
            halign: 'center',
            fontStyle: 'bold',
          },
        },
      ],
      [
        'Date', 'Price', 'Volume', 'Commission', 'P&L',
        'Date', 'Price', 'Volume', 'Commission', 'P&L',
      ],
    ],
    body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineColor: BORDER,
      lineWidth: 0.35,
      textColor: TEXT,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: WHITE,
      textColor: TEXT,
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: colW },
      1: { cellWidth: colW },
      2: { cellWidth: colW },
      3: { cellWidth: colW },
      4: { cellWidth: colW },
      5: { cellWidth: colW },
      6: { cellWidth: colW },
      7: { cellWidth: colW },
      8: { cellWidth: colW },
      9: { cellWidth: colW },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data: CellHookData) => {
      if (data.section === 'body' && data.row.index < rowCount) {
        const c = data.column.index
        if (
          c === 1 || c === 2 || c === 3 || c === 4 ||
          c === 6 || c === 7 || c === 8 || c === 9
        ) {
          data.cell.styles.halign = 'right'
        }
      }
    },
  })
  return (doc as any).lastAutoTable.finalY
}

// ─── Locate matching user in /bills envelope ────────────────────────
export const findUserInBillsResponse = (
  raw: any,
  login: number | string
): UserBillDetail | null => {
  const root = raw?.data ?? raw ?? {}
  const candidates: any[] = []
  const seen = new Set<any>()
  const visit = (node: any) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return
    seen.add(node)
    if (Array.isArray(node)) {
      candidates.push(...node)
      return
    }
    for (const k of Object.keys(node)) {
      const v = node[k]
      if (Array.isArray(v)) candidates.push(...v)
      else if (v && typeof v === 'object' && k !== 'SettlementWeek') visit(v)
    }
  }
  visit(root)
  const target = String(login)
  return (
    candidates.find(
      (c) => c && String(c.Login ?? c.login ?? '') === target
    ) ?? null
  )
}
