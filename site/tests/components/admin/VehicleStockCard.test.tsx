import { render, screen } from '@testing-library/react'

import { VehicleStockCard } from '@/components/admin/VehicleStockCard'

const NOW = new Date('2026-09-01T12:00:00.000Z')

function makeVehicle(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', color: 'Branco',
    year_model: 2023, mileage_km: 32000, price_cents: 6490000,
    status: 'available', is_featured: false,
    acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, acquired_at: null, created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as any
}

describe('VehicleStockCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => vi.useRealTimers())

  it('links to the vehicle summary page', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/admin/veiculos/v-1')
  })

  it('shows a "Sem margem definida" notice when acquisition cost or minimum price is missing', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} />)
    expect(screen.getByText(/sem margem definida/i)).toBeInTheDocument()
  })

  it('shows the minimum-price band with custo/lucro once a margin is defined', () => {
    const vehicle = makeVehicle({ acquisition_cost_cents: 4568600, min_sale_price_cents: 5549000 })
    render(<VehicleStockCard vehicle={vehicle} totalCostCents={4568600} thresholdDays={90} />)
    expect(screen.getByText(/mínimo à vista r\$ 55.490/i)).toBeInTheDocument()
    expect(screen.getByText(/custo r\$ 45.686/i)).toBeInTheDocument()
    expect(screen.getByText(/lucro r\$ 19.214/i)).toBeInTheDocument()
  })

  it('shows the days-in-stock badge, computed from acquired_at', () => {
    render(<VehicleStockCard vehicle={makeVehicle({ acquired_at: '2026-08-01' })} totalCostCents={0} thresholdDays={90} />)
    expect(screen.getByText('31 dias')).toBeInTheDocument()
  })

  it('turns the days badge red when an available vehicle is at or past the turnover threshold', () => {
    render(
      <VehicleStockCard
        vehicle={makeVehicle({ status: 'available', acquired_at: '2020-01-01' })}
        totalCostCents={0}
        thresholdDays={90}
      />,
    )
    expect(screen.getByText(/\d+ dias/)).toHaveClass('bg-aguiar-red')
  })

  it('keeps the days badge neutral for preparing or sold vehicles even at a high day count', () => {
    const { unmount } = render(
      <VehicleStockCard vehicle={makeVehicle({ status: 'preparing', acquired_at: '2020-01-01' })} totalCostCents={0} thresholdDays={90} />,
    )
    expect(screen.getByText(/\d+ dias/)).toHaveClass('bg-graphite')
    unmount()

    render(<VehicleStockCard vehicle={makeVehicle({ status: 'sold', acquired_at: '2020-01-01' })} totalCostCents={0} thresholdDays={90} />)
    expect(screen.getByText(/\d+ dias/)).toHaveClass('bg-graphite')
  })
})
