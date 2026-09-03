import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Vehicle } from './types'
import { formatPriceFromCents } from './format'
import { getStoreSnapshot, type SalesPanelMetrics } from './dashboard'

export interface PainelPdfData {
  goal: number | null
  soldCount: number
  periodLabel: string
  metrics: SalesPanelMetrics
  vehicles: Vehicle[]
  expenseTotals: Record<string, number>
}

const ACCENT_RED: [number, number, number] = [211, 32, 39] // aguiar-red
const HEADER_GRAY: [number, number, number] = [17, 17, 17] // graphite
const LABEL_GRAY: [number, number, number] = [110, 110, 110] // support-gray

function sectionTable(doc: jsPDF, title: string, rows: [string, string][], startY: number): number {
  doc.setFontSize(12)
  doc.setTextColor(...HEADER_GRAY)
  doc.text(title, 14, startY)

  autoTable(doc, {
    body: rows,
    startY: startY + 4,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: { top: 2, bottom: 2, left: 0, right: 4 } },
    columnStyles: {
      0: { textColor: LABEL_GRAY, cellWidth: 90 },
      1: { textColor: HEADER_GRAY, fontStyle: 'bold', halign: 'right' },
    },
  })

  // jspdf-autotable stamps the table's final Y onto the doc instance.
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
}

/** Builds a one-page snapshot PDF of the Painel: meta do mês, vendas do período selecionado, e o estoque atual. */
export function buildPainelPdf(data: PainelPdfData): jsPDF {
  const doc = new jsPDF()

  doc.setFillColor(...ACCENT_RED)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('Painel — Aguiar Veículos', 14, 14)
  doc.setFontSize(9)
  doc.text(new Date().toLocaleDateString('pt-BR'), 196, 14, { align: 'right' })

  let y = 34
  y = sectionTable(doc, 'Meta do mês', [
    ['Vendas realizadas', data.goal != null ? `${data.soldCount} de ${data.goal}` : `${data.soldCount}`],
    ['Situação', data.goal != null ? (data.soldCount >= data.goal ? 'Meta batida' : 'Em andamento') : 'Nenhuma meta definida'],
  ], y)

  y = sectionTable(doc, `Vendas — ${data.periodLabel}`, [
    ['Vendas', `${data.metrics.count}`],
    ['Faturamento', formatPriceFromCents(data.metrics.revenueCents)],
    ['Ticket médio', formatPriceFromCents(data.metrics.averageSaleCents)],
    ['Lucro', formatPriceFromCents(data.metrics.profitCents)],
    ['Margem', `${data.metrics.marginPercent}%`],
  ], y)

  const snapshot = getStoreSnapshot(data.vehicles, data.expenseTotals)
  sectionTable(doc, 'Sua loja agora', [
    ['Valor gasto no estoque', formatPriceFromCents(snapshot.investedCents)],
    ['Valor de venda do estoque', formatPriceFromCents(snapshot.listValueCents)],
    ['Lucro esperado', formatPriceFromCents(snapshot.expectedProfitCents)],
  ], y)

  return doc
}
