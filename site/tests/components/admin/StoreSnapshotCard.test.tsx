import { render, screen } from '@testing-library/react'
import { StoreSnapshotCard } from '@/components/admin/StoreSnapshotCard'
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

describe('StoreSnapshotCard', () => {
  it('shows invested, list value and expected profit for the current stock', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'available', price_cents: 8000000, acquisition_cost_cents: 5000000 }),
    ]
    render(<StoreSnapshotCard vehicles={vehicles} expenseTotals={{}} />)
    expect(screen.getByText('Investido no estoque')).toBeInTheDocument()
    expect(screen.getByText('Valor de venda do estoque')).toBeInTheDocument()
    expect(screen.getByText('Lucro esperado')).toBeInTheDocument()
    expect(screen.getByText('R$ 50.000')).toBeInTheDocument()
    expect(screen.getByText('R$ 80.000')).toBeInTheDocument()
    expect(screen.getByText('R$ 30.000')).toBeInTheDocument()
    expect(screen.getByText('investido no 1 carro em estoque')).toBeInTheDocument()
    expect(screen.getByText('se vender na margem atual')).toBeInTheDocument()
  })

  it('pluralizes the vehicle count subtext for more than one vehicle', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'available', price_cents: 8000000, acquisition_cost_cents: 5000000 }),
      makeVehicle({ id: 'b', status: 'preparing', price_cents: 6000000, acquisition_cost_cents: 4000000 }),
    ]
    render(<StoreSnapshotCard vehicles={vehicles} expenseTotals={{}} />)
    expect(screen.getByText('investido nos 2 carros em estoque')).toBeInTheDocument()
  })

  it('shows expected profit in red when the stock is upside down', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'available', price_cents: 5000000, acquisition_cost_cents: 8000000 }),
    ]
    render(<StoreSnapshotCard vehicles={vehicles} expenseTotals={{}} />)
    const profitValue = screen.getByText('-R$ 30.000')
    expect(profitValue).toBeInTheDocument()
    expect(profitValue.className).toContain('text-aguiar-red')
  })
})
