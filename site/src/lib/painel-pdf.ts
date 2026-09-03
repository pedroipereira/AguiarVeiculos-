import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Vehicle, Lead } from './types'
import { formatPriceFromCents } from './format'
import { getStoreSnapshot, getFunnelData, getSalesTimeSeries, type SalesPanelMetrics } from './dashboard'
import { daysInStock } from './vehicle-stock'

export interface PainelPdfData {
  goal: number | null
  soldCount: number
  periodLabel: string
  metrics: SalesPanelMetrics
  vehicles: Vehicle[]
  expenseTotals: Record<string, number>
  leads: Lead[]
  thresholdDays: number
  now?: Date
}

const PAGE_BOTTOM = 280
const ACCENT_RED: [number, number, number] = [211, 32, 39] // aguiar-red
const HEADER_GRAY: [number, number, number] = [17, 17, 17] // graphite
const LABEL_GRAY: [number, number, number] = [110, 110, 110] // support-gray

/** Starts a new page if the next section (title + a few rows) wouldn't fit on this one. */
function ensureRoom(doc: jsPDF, y: number, neededHeight = 40): number {
  if (y + neededHeight <= PAGE_BOTTOM) return y
  doc.addPage()
  return 20
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(12)
  doc.setTextColor(...HEADER_GRAY)
  doc.text(title, 14, y)
  return y + 4
}

function finalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

/** A label/value pair table (Meta, Vendas, Sua loja agora, Giro do estoque). */
function keyValueSection(doc: jsPDF, title: string, rows: [string, string][], y: number): number {
  y = ensureRoom(doc, y, 16 + rows.length * 7)
  const bodyStartY = sectionTitle(doc, title, y)

  autoTable(doc, {
    body: rows,
    startY: bodyStartY,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: { top: 2, bottom: 2, left: 0, right: 4 } },
    columnStyles: {
      0: { textColor: LABEL_GRAY, cellWidth: 90 },
      1: { textColor: HEADER_GRAY, fontStyle: 'bold', halign: 'right' },
    },
  })

  return finalY(doc) + 10
}

/** A multi-column table (Carros parados, Vendas por dia). */
function listSection(doc: jsPDF, title: string, head: string[], body: string[][], y: number): number {
  y = ensureRoom(doc, y, 24 + Math.min(body.length, 3) * 7)
  const bodyStartY = sectionTitle(doc, title, y)

  autoTable(doc, {
    head: [head],
    body,
    startY: bodyStartY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: HEADER_GRAY, textColor: 255 },
  })

  return finalY(doc) + 10
}

/** Builds a full snapshot PDF of the Painel: meta, vendas do período, estoque atual, funil, giro, carros parados e vendas recentes. */
export function buildPainelPdf(data: PainelPdfData): jsPDF {
  const now = data.now ?? new Date()
  const doc = new jsPDF()

  doc.setFillColor(...ACCENT_RED)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('Painel — Aguiar Veículos', 14, 14)
  doc.setFontSize(9)
  doc.text(now.toLocaleDateString('pt-BR'), 196, 14, { align: 'right' })

  let y = 34

  y = keyValueSection(doc, 'Meta do mês', [
    ['Vendas realizadas', data.goal != null ? `${data.soldCount} de ${data.goal}` : `${data.soldCount}`],
    ['Situação', data.goal != null ? (data.soldCount >= data.goal ? 'Meta batida' : 'Em andamento') : 'Nenhuma meta definida'],
  ], y)

  y = keyValueSection(doc, `Vendas — ${data.periodLabel}`, [
    ['Vendas', `${data.metrics.count}`],
    ['Faturamento', formatPriceFromCents(data.metrics.revenueCents)],
    ['Ticket médio', formatPriceFromCents(data.metrics.averageSaleCents)],
    ['Lucro', formatPriceFromCents(data.metrics.profitCents)],
    ['Margem', `${data.metrics.marginPercent}%`],
  ], y)

  const snapshot = getStoreSnapshot(data.vehicles, data.expenseTotals)
  y = keyValueSection(doc, 'Sua loja agora', [
    ['Valor gasto no estoque', formatPriceFromCents(snapshot.investedCents)],
    ['Valor de venda do estoque', formatPriceFromCents(snapshot.listValueCents)],
    ['Lucro esperado', formatPriceFromCents(snapshot.expectedProfitCents)],
  ], y)

  const funnel = getFunnelData(data.leads)
  y = listSection(doc, 'Funil — clientes por etapa', ['Etapa', 'Clientes'], funnel.map((entry) => [entry.label, `${entry.count}`]), y)

  const availableAged = data.vehicles
    .filter((vehicle) => vehicle.status === 'available')
    .map((vehicle) => ({ vehicle, days: daysInStock(vehicle, now) }))
    .sort((a, b) => b.days - a.days)
  const avgDays = availableAged.length > 0
    ? Math.round(availableAged.reduce((sum, { days }) => sum + days, 0) / availableAged.length)
    : 0
  const staleCount = availableAged.filter(({ days }) => days >= data.thresholdDays).length

  y = keyValueSection(doc, 'Giro do estoque', [
    ['Giro médio', `${avgDays}d`],
    ['Carros disponíveis', `${availableAged.length}`],
    [`Parados há mais de ${data.thresholdDays}d`, `${staleCount}`],
  ], y)

  y = listSection(
    doc,
    'Carros parados há mais tempo',
    ['Veículo', 'Dias', 'Preço'],
    availableAged.slice(0, 6).map(({ vehicle, days }) => [
      `${vehicle.brand} ${vehicle.model} ${vehicle.version ?? ''}`.trim(),
      `${days}d`,
      formatPriceFromCents(vehicle.price_cents),
    ]),
    y,
  )

  const last7Days = getSalesTimeSeries(data.vehicles, 'day', 7, now)
  listSection(
    doc,
    'Vendas nos últimos 7 dias',
    ['Dia', 'Vendas'],
    last7Days.map((point) => [point.bucketLabel, `${point.count}`]),
    y,
  )

  return doc
}
