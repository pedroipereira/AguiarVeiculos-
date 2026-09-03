import { jsPDF } from 'jspdf'
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

/** Builds a one-page snapshot PDF of the Painel: meta do mês, vendas do período selecionado, e o estoque atual. */
export function buildPainelPdf(data: PainelPdfData): jsPDF {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Painel — Aguiar Veículos', 14, 15)
  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(new Date().toLocaleDateString('pt-BR'), 14, 21)

  let y = 34
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Meta do mês', 14, y)
  doc.setFontSize(10)
  doc.setTextColor(80)
  y += 6
  doc.text(data.goal != null ? `${data.soldCount} de ${data.goal} vendas` : 'Nenhuma meta definida', 14, y)

  y += 14
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(`Vendas — ${data.periodLabel}`, 14, y)
  doc.setFontSize(10)
  doc.setTextColor(80)
  y += 6
  doc.text(`Lucro: ${formatPriceFromCents(data.metrics.profitCents)}`, 14, y)
  y += 6
  doc.text(`Faturamento: ${formatPriceFromCents(data.metrics.revenueCents)}`, 14, y)
  y += 6
  doc.text(`Vendas: ${data.metrics.count}`, 14, y)

  const snapshot = getStoreSnapshot(data.vehicles, data.expenseTotals)
  y += 14
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Sua loja agora', 14, y)
  doc.setFontSize(10)
  doc.setTextColor(80)
  y += 6
  doc.text(`Valor gasto no estoque: ${formatPriceFromCents(snapshot.investedCents)}`, 14, y)
  y += 6
  doc.text(`Valor de venda do estoque: ${formatPriceFromCents(snapshot.listValueCents)}`, 14, y)
  y += 6
  doc.text(`Lucro esperado: ${formatPriceFromCents(snapshot.expectedProfitCents)}`, 14, y)

  return doc
}
