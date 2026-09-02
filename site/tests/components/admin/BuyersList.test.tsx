import { render, screen } from '@testing-library/react'
import { BuyersList } from '@/components/admin/BuyersList'
import type { Lead, Vehicle } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: 'v-1', stage: 'vendeu', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'fiat-argo', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2023, year_fabrication: 2023, mileage_km: 30000, price_cents: 6490000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null, horsepower: null,
    is_featured: false, status: 'sold', created_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: 6200000, sold_at: '2026-09-02', buyer_lead_id: 'l-1',
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null, fipe_value_cents: null, fipe_fetched_at: null,
    optionals: [],
    ...overrides,
  }
}

describe('BuyersList', () => {
  it('shows the empty state when there are no buyers', () => {
    render(<BuyersList buyers={[]} />)
    expect(screen.getByText('Nenhuma venda neste mês.')).toBeInTheDocument()
  })

  it('lists each buyer with their vehicle, sale price, and date', () => {
    render(<BuyersList buyers={[{ lead: makeLead(), vehicle: makeVehicle() }]} />)
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('98999999999')).toBeInTheDocument()
    expect(screen.getByText(/Fiat Argo Drive/)).toBeInTheDocument()
    expect(screen.getByText('R$ 62.000')).toBeInTheDocument()
    expect(screen.getByText('02/09/2026')).toBeInTheDocument()
  })
})
