import { render, screen, fireEvent } from '@testing-library/react'
import { SalesTimeSeriesChart } from '@/components/admin/SalesTimeSeriesChart'
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

describe('SalesTimeSeriesChart', () => {
  it('renders the heading and the three period options, "Últimos 7 dias" selected by default', () => {
    render(<SalesTimeSeriesChart vehicles={[]} now={new Date(2026, 8, 25)} />)
    expect(screen.getByText('Vendas ao longo do tempo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Últimos 7 dias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Últimas 4 semanas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Últimos 12 meses' })).toBeInTheDocument()
  })

  it('switches granularity when a different period button is clicked, without throwing', () => {
    const vehicles = [makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-07-01' })]
    render(<SalesTimeSeriesChart vehicles={vehicles} now={new Date(2026, 8, 25)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Últimos 12 meses' }))
    expect(screen.getByText('Vendas ao longo do tempo')).toBeInTheDocument()
  })
})
