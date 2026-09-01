import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/app/actions/vehicles', () => ({
  adminDeleteVehicle: vi.fn(), adminSetVehicleFeatured: vi.fn(), adminSetVehicleStatus: vi.fn(), adminMarkVehicleSold: vi.fn(),
}))

import { VehicleStockGrid } from '@/components/admin/VehicleStockGrid'

const NOW = new Date('2026-09-01T12:00:00.000Z')

function makeVehicle(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: overrides.id ?? 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', color: 'Branco',
    year_model: 2023, mileage_km: 32000, price_cents: 6490000,
    status: 'available', is_featured: false,
    acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, acquired_at: null, created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as any
}

describe('VehicleStockGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  const vehicles = [
    makeVehicle({ id: 'a', brand: 'Fiat', model: 'Argo', status: 'available', acquisition_cost_cents: 100, min_sale_price_cents: 200 }),
    makeVehicle({ id: 'b', brand: 'Volkswagen', model: 'Polo', status: 'available' }),
    makeVehicle({ id: 'c', brand: 'Toyota', model: 'Corolla', status: 'preparing' }),
  ]

  it('shows every vehicle under "Todos" with the correct count', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    expect(screen.getByRole('button', { name: /todos \(3\)/i })).toBeInTheDocument()
    expect(screen.getByText(/fiat argo/i)).toBeInTheDocument()
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument()
  })

  it('filters to only vehicles without a margin when "Sem margem" is clicked', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /sem margem/i }))
    expect(screen.queryByText(/fiat argo/i)).not.toBeInTheDocument()
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument()
  })

  it('filters to only preparing vehicles when "Em preparação" is clicked', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    // Anchored regex: with the "Todos" filter active, two seed vehicles are `available`
    // and each renders VehicleStockCard's own "Marcar em preparação" status-toggle button,
    // which also satisfies an unanchored /em preparação/i match against the "Em preparação (1)"
    // tab button. Anchoring to the start targets only the tab.
    fireEvent.click(screen.getByRole('button', { name: /^em preparação/i }))
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument()
    expect(screen.queryByText(/fiat argo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/volkswagen polo/i)).not.toBeInTheDocument()
  })

  it('shows the configured threshold in the "Girar" tab label', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={120} leads={[]} />)
    expect(screen.getByRole('button', { name: /girar \(\+120d\)/i })).toBeInTheDocument()
  })

  it('filters by free-text search across brand and model', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    fireEvent.change(screen.getByLabelText(/buscar veículo/i), { target: { value: 'polo' } })
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.queryByText(/fiat argo/i)).not.toBeInTheDocument()
  })

  it('passes the cover image URL and combined total cost (acquisition + expenses) down to each card', () => {
    const priced = [makeVehicle({ id: 'a', acquisition_cost_cents: 100000, min_sale_price_cents: 200000 })]
    render(
      <VehicleStockGrid
        vehicles={priced}
        coverImageUrls={{ a: 'https://example.com/a.jpg' }}
        expenseTotalsCents={{ a: 5000 }}
        thresholdDays={90}
        leads={[]}
      />,
    )
    expect(screen.getByRole('img', { name: /fiat argo/i })).toHaveAttribute('src', 'https://example.com/a.jpg')
    // totalCostCents = 100000 (acquisition) + 5000 (expenses) = 105000 = R$ 1.050
    expect(screen.getByText(/custo r\$ 1.050/i)).toBeInTheDocument()
  })

  it('shows an empty state when no vehicle matches the active filter', () => {
    render(<VehicleStockGrid vehicles={[]} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    expect(screen.getByText(/nenhum veículo encontrado/i)).toBeInTheDocument()
  })
})
