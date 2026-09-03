import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { buildPainelPdf, save } = vi.hoisted(() => ({ buildPainelPdf: vi.fn(), save: vi.fn() }))
vi.mock('@/lib/painel-pdf', () => ({ buildPainelPdf: buildPainelPdf.mockReturnValue({ save }) }))

import { SalesPanel } from '@/components/admin/SalesPanel'
import type { Vehicle } from '@/lib/types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2024, year_fabrication: 2024, mileage_km: 10000, price_cents: 8000000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null,
    horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null,
    fipe_value_cents: null, fipe_fetched_at: null, optionals: [],
    ...overrides,
  }
}

const NOW = new Date(2026, 8, 25)

describe('SalesPanel', () => {
  it('defaults to the "Mês" preset and shows aggregated metrics', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000, acquisition_cost_cents: 3000000 }),
    ]
    render(<SalesPanel vehicles={vehicles} expenseTotals={{}} goal={20} soldCount={12} now={NOW} />)
    expect(screen.getByText('Vendas')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows margin and sale count under Lucro, and the average ticket under Faturamento', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000, acquisition_cost_cents: 3000000 }),
    ]
    render(<SalesPanel vehicles={vehicles} expenseTotals={{}} goal={20} soldCount={12} now={NOW} />)
    expect(screen.getByText('margem 40% · 1 venda no período')).toBeInTheDocument()
    expect(screen.getByText('Ticket médio R$ 50.000 por venda')).toBeInTheDocument()
    expect(screen.getByText('Período: Mês')).toBeInTheDocument()
  })

  it('switches period when a preset button is clicked', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-25', sale_price_cents: 5000000 }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-09-01', sale_price_cents: 4000000 }),
    ]
    render(<SalesPanel vehicles={vehicles} expenseTotals={{}} goal={20} soldCount={12} now={NOW} />)

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('reveals two date pickers when "Personalizado" is selected', () => {
    render(<SalesPanel vehicles={[]} expenseTotals={{}} goal={null} soldCount={0} now={NOW} />)
    fireEvent.click(screen.getByRole('button', { name: 'Personalizado' }))
    expect(screen.getByLabelText('De')).toBeInTheDocument()
    expect(screen.getByLabelText('até')).toBeInTheDocument()
  })

  it('filters by the picked custom range once both dates are chosen', () => {
    // VehicleDatePicker opens on the real wall-clock month when no date is
    // selected yet, so the system clock must be pinned to line up with NOW.
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    try {
      const vehicles = [
        makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000 }),
        makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-09-20', sale_price_cents: 4000000 }),
      ]
      render(<SalesPanel vehicles={vehicles} expenseTotals={{}} goal={null} soldCount={0} now={NOW} />)
      fireEvent.click(screen.getByRole('button', { name: 'Personalizado' }))

      fireEvent.click(screen.getByLabelText('De'))
      fireEvent.click(screen.getByRole('button', { name: '10' }))
      fireEvent.click(screen.getByLabelText('até'))
      fireEvent.click(screen.getByRole('button', { name: '10' }))

      expect(screen.getByText('1')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('exports a PDF with the goal, the selected period label, and the current metrics', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000, acquisition_cost_cents: 3000000 }),
    ]
    render(<SalesPanel vehicles={vehicles} expenseTotals={{}} goal={20} soldCount={12} now={NOW} />)

    fireEvent.click(screen.getByRole('button', { name: /exportar pdf/i }))

    expect(buildPainelPdf).toHaveBeenCalledWith({
      goal: 20,
      soldCount: 12,
      periodLabel: 'Mês',
      metrics: { count: 1, revenueCents: 5000000, profitCents: 2000000, marginPercent: 40, averageSaleCents: 5000000 },
      vehicles,
      expenseTotals: {},
    })
    expect(save).toHaveBeenCalled()
  })
})
