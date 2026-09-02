import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } = vi.hoisted(() => ({
  adminDeleteVehicle: vi.fn(),
  adminSetVehicleFeatured: vi.fn(),
  adminSetVehicleStatus: vi.fn(),
}))
vi.mock('@/app/actions/vehicles', () => ({ adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus, adminMarkVehicleSold: vi.fn() }))
vi.mock('@/app/actions/leads', () => ({ adminCreateManualLead: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.spyOn(window, 'confirm').mockReturnValue(true)

import { VehicleSummaryPanel } from '@/components/admin/VehicleSummaryPanel'

const NOW = new Date('2026-09-01T12:00:00.000Z')

function makeVehicle(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', color: 'Branco',
    year_model: 2023, mileage_km: 32000, price_cents: 6490000, transmission: 'Automático', fuel_type: 'Flex',
    status: 'available', is_featured: false, optionals: [],
    acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, acquired_at: null, created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as any
}

describe('VehicleSummaryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => vi.useRealTimers())

  it('links "Editar margem" and "Editar carro/foto" to the edit route', () => {
    render(<VehicleSummaryPanel vehicle={makeVehicle()} imageUrls={[]} totalCostCents={0} thresholdDays={90} leads={[]} />)
    expect(screen.getByRole('link', { name: /editar margem/i })).toHaveAttribute('href', '/admin/veiculos/v-1/editar#custos')
    expect(screen.getByRole('link', { name: /editar carro\/foto/i })).toHaveAttribute('href', '/admin/veiculos/v-1/editar')
  })

  it('shows the minimum-price band with custo/lucro once a margin is defined', () => {
    const vehicle = makeVehicle({ acquisition_cost_cents: 4568600, min_sale_price_cents: 5549000 })
    render(<VehicleSummaryPanel vehicle={vehicle} imageUrls={[]} totalCostCents={4568600} thresholdDays={90} leads={[]} />)
    expect(screen.getByText(/r\$ 55.490/i)).toBeInTheDocument()
    expect(screen.getByText(/r\$ 45.686/i)).toBeInTheDocument()
    expect(screen.getByText(/r\$ 19.214/i)).toBeInTheDocument()
  })

  it('deletes the vehicle on confirm', () => {
    render(<VehicleSummaryPanel vehicle={makeVehicle()} imageUrls={[]} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /remover carro/i }))
    expect(adminDeleteVehicle).toHaveBeenCalledWith('v-1')
  })

  it('toggles destaque no site', () => {
    render(<VehicleSummaryPanel vehicle={makeVehicle()} imageUrls={[]} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /destacar no site/i }))
    expect(adminSetVehicleFeatured).toHaveBeenCalledWith('v-1', true)
  })

  it('moves an available vehicle to preparing', () => {
    render(<VehicleSummaryPanel vehicle={makeVehicle({ status: 'available' })} imageUrls={[]} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar em preparação/i }))
    expect(adminSetVehicleStatus).toHaveBeenCalledWith('v-1', 'preparing')
  })

  it('shows the sale form when "Marcar como vendido" is clicked, and hides the trigger', () => {
    render(<VehicleSummaryPanel vehicle={makeVehicle()} imageUrls={[]} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar como vendido/i }))
    expect(screen.getByLabelText(/preço de venda/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como vendido/i })).not.toBeInTheDocument()
  })

  it('offers "Marcar como disponível" (not the sale form) for an already-sold vehicle', () => {
    render(
      <VehicleSummaryPanel
        vehicle={makeVehicle({ status: 'sold', sale_price_cents: 6200000 })}
        imageUrls={[]}
        totalCostCents={0}
        thresholdDays={90}
        leads={[]}
      />,
    )
    expect(screen.getByRole('button', { name: /marcar como disponível/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como vendido/i })).not.toBeInTheDocument()
  })

  it('opens a lead modal pre-filled to this vehicle when "Registrar cliente/negociação" is clicked', () => {
    render(<VehicleSummaryPanel vehicle={makeVehicle()} imageUrls={[]} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /registrar cliente/i }))

    const dialog = screen.getByRole('dialog', { name: /registrar cliente/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByLabelText(/veículo de interesse/i)).toHaveValue('v-1')
    expect(screen.getByLabelText(/estágio no funil/i)).toHaveValue('negociando')
  })

  it('shows the days-in-stock badge in red once past the turnover threshold', () => {
    render(
      <VehicleSummaryPanel
        vehicle={makeVehicle({ status: 'available', acquired_at: '2020-01-01' })}
        imageUrls={[]}
        totalCostCents={0}
        thresholdDays={90}
        leads={[]}
      />,
    )
    expect(screen.getByText(/dias no estoque/)).toHaveClass('bg-aguiar-red')
  })
})
