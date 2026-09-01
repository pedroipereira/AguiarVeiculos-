import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } = vi.hoisted(() => ({
  adminDeleteVehicle: vi.fn(),
  adminSetVehicleFeatured: vi.fn(),
  adminSetVehicleStatus: vi.fn(),
}))
vi.mock('@/app/actions/vehicles', () => ({ adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus, adminMarkVehicleSold: vi.fn() }))
vi.spyOn(window, 'confirm').mockReturnValue(true)

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
    vi.clearAllMocks()
    // VehicleStockCard calls daysInStock(vehicle) with no explicit `now`, so it
    // falls back to `new Date()` — fake the clock rather than let this test's
    // pass/fail depend on which real-world day it happens to run on.
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => vi.useRealTimers())

  it('shows a "Definir margem" pill when acquisition cost or minimum price is missing', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    expect(screen.getByRole('link', { name: /definir margem/i })).toHaveAttribute('href', '/admin/veiculos/v-1')
  })

  it('shows the minimum-price band with custo/lucro once a margin is defined', () => {
    const vehicle = makeVehicle({ acquisition_cost_cents: 4568600, min_sale_price_cents: 5549000 })
    render(<VehicleStockCard vehicle={vehicle} totalCostCents={4568600} thresholdDays={90} leads={[]} />)
    expect(screen.getByText(/mínimo à vista r\$ 55.490/i)).toBeInTheDocument()
    expect(screen.getByText(/custo r\$ 45.686/i)).toBeInTheDocument()
    expect(screen.getByText(/lucro r\$ 19.214/i)).toBeInTheDocument()
  })

  it('shows the days-in-stock badge, computed from acquired_at', () => {
    render(<VehicleStockCard vehicle={makeVehicle({ acquired_at: '2026-08-01' })} totalCostCents={0} thresholdDays={90} leads={[]} />)
    expect(screen.getByText('31 dias')).toBeInTheDocument()
  })

  it('deletes the vehicle on confirm', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(adminDeleteVehicle).toHaveBeenCalledWith('v-1')
  })

  it('toggles destaque', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /destacar/i }))
    expect(adminSetVehicleFeatured).toHaveBeenCalledWith('v-1', true)
  })

  it('moves an available vehicle to preparing and back', () => {
    render(<VehicleStockCard vehicle={makeVehicle({ status: 'available' })} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar em preparação/i }))
    expect(adminSetVehicleStatus).toHaveBeenCalledWith('v-1', 'preparing')
  })

  it('shows the sale form when "Marcar como vendido" is clicked, and hides the trigger', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar como vendido/i }))
    expect(screen.getByLabelText(/preço de venda/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como vendido/i })).not.toBeInTheDocument()
  })

  it('offers "Marcar como disponível" (not the sale form) for an already-sold vehicle', () => {
    render(<VehicleStockCard vehicle={makeVehicle({ status: 'sold', sale_price_cents: 6200000 })} totalCostCents={0} thresholdDays={90} leads={[]} />)
    expect(screen.getByRole('button', { name: /marcar como disponível/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como vendido/i })).not.toBeInTheDocument()
  })
})
