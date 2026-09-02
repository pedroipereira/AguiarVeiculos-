import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Vehicle } from './types'
import { formatPriceFromCents } from './format'
import { daysInStock } from './vehicle-stock'
import { calculateEstimatedMarginCents, calculateRealizedMarginCents } from './vehicle-costs'

export interface StockPdfOptions {
  includeDays?: boolean
  includeCost?: boolean
  includeMargin?: boolean
  includeFipe?: boolean
}

export type StockPdfVehicle = Pick<
  Vehicle,
  | 'id'
  | 'brand'
  | 'model'
  | 'version'
  | 'year_model'
  | 'mileage_km'
  | 'color'
  | 'price_cents'
  | 'status'
  | 'acquisition_cost_cents'
  | 'sale_price_cents'
  | 'fipe_value_cents'
  | 'acquired_at'
  | 'created_at'
>

export function buildStockPdf(
  vehicles: StockPdfVehicle[],
  totalCostCentsByVehicleId: Record<string, number>,
  options: StockPdfOptions = {},
): jsPDF {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Estoque — Aguiar Veículos', 14, 15)
  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(new Date().toLocaleDateString('pt-BR'), 14, 21)

  const head = ['Veículo', 'Valor de venda']
  if (options.includeDays) head.push('Dias em estoque')
  if (options.includeCost) head.push('Valor pago')
  if (options.includeMargin) head.push('Lucro')
  if (options.includeFipe) head.push('FIPE')

  const body = vehicles.map((vehicle) => {
    const row = [
      `${vehicle.brand} ${vehicle.model} ${vehicle.version ?? ''}`.trim() +
        `\n${vehicle.year_model} · ${vehicle.mileage_km.toLocaleString('pt-BR')} km · ${vehicle.color ?? ''}`,
      formatPriceFromCents(vehicle.price_cents),
    ]
    if (options.includeDays) row.push(`${daysInStock(vehicle)}`)
    if (options.includeCost) {
      row.push(vehicle.acquisition_cost_cents != null ? formatPriceFromCents(vehicle.acquisition_cost_cents) : '—')
    }
    if (options.includeMargin) {
      const totalCostCents = totalCostCentsByVehicleId[vehicle.id] ?? 0
      const marginCents = vehicle.status === 'sold'
        ? calculateRealizedMarginCents(vehicle.sale_price_cents, totalCostCents)
        : calculateEstimatedMarginCents(vehicle.price_cents, totalCostCents)
      row.push(marginCents != null ? formatPriceFromCents(marginCents) : '—')
    }
    if (options.includeFipe) {
      row.push(vehicle.fipe_value_cents != null ? formatPriceFromCents(vehicle.fipe_value_cents) : '—')
    }
    return row
  })

  autoTable(doc, { head: [head], body, startY: 26, styles: { fontSize: 9 } })
  return doc
}
