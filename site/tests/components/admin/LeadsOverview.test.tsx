import { render, screen, fireEvent, within } from '@testing-library/react'
import { vi } from 'vitest'

const { adminUpdateLeadStage, adminDeleteLead, adminCreateManualLead, adminUpdateLead } = vi.hoisted(() => ({
  adminUpdateLeadStage: vi.fn(),
  adminDeleteLead: vi.fn(),
  adminCreateManualLead: vi.fn(),
  adminUpdateLead: vi.fn(),
}))
vi.mock('@/app/actions/leads', () => ({ adminUpdateLeadStage, adminDeleteLead, adminCreateManualLead, adminUpdateLead }))

const { adminMarkVehicleSold } = vi.hoisted(() => ({ adminMarkVehicleSold: vi.fn() }))
vi.mock('@/app/actions/vehicles', () => ({ adminMarkVehicleSold }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { LeadsOverview } from '@/components/admin/LeadsOverview'
import { getCurrentMonthValue } from '@/lib/lead-summary'
import type { Lead, Vehicle } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
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

const VEHICLE_OPTIONS = [{ id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', status: 'sold' as const, price_cents: 6490000 }]

describe('LeadsOverview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the summary cards with counts derived from the leads and vehicles', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'novo' }),
      makeLead({ id: 'b', stage: 'negociando' }),
      makeLead({ id: 'c', stage: 'vendeu', vehicle_id: 'v-1' }),
    ]
    const vehicles = [makeVehicle({ sold_at: `${getCurrentMonthValue()}-02` })]
    render(<LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={VEHICLE_OPTIONS} />)

    const activeCard = screen.getByText('Clientes ativos').closest('div') as HTMLElement
    expect(within(activeCard).getByText('2')).toBeInTheDocument()

    const negotiatingCard = screen.getByText('Em negociação').closest('div') as HTMLElement
    expect(within(negotiatingCard).getByText('1')).toBeInTheDocument()

    const soldCard = screen.getByText('Vendas no mês').closest('div') as HTMLElement
    expect(within(soldCard).getByText('1')).toBeInTheDocument()
  })

  it('shows the Funil (kanban) tab by default', () => {
    render(<LeadsOverview leads={[makeLead()]} vehicles={[]} vehicleOptions={VEHICLE_OPTIONS} />)
    expect(screen.getByText('Lead novo')).toBeInTheDocument()
  })

  it('switches to the Compradores tab and shows the buyers list', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ sold_at: `${getCurrentMonthValue()}-02` })]
    render(<LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={VEHICLE_OPTIONS} />)

    fireEvent.click(screen.getByRole('button', { name: 'Compradores' }))
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.queryByText('Lead novo')).not.toBeInTheDocument()
  })

  it('changing the month updates "Vendas no mês" without changing "Clientes ativos"', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' })]
    const vehicles = [makeVehicle({ sold_at: '2026-08-15' })]
    render(<LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={VEHICLE_OPTIONS} />)

    fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2026-08' } })
    const soldCard = screen.getByText('Vendas no mês').closest('div') as HTMLElement
    expect(within(soldCard).getByText('1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2026-01' } })
    const soldCardAfter = screen.getByText('Vendas no mês').closest('div') as HTMLElement
    expect(within(soldCardAfter).getByText('0')).toBeInTheDocument()

    const activeCard = screen.getByText('Clientes ativos').closest('div') as HTMLElement
    expect(within(activeCard).getByText('1')).toBeInTheDocument()
  })

  it('opens the "Novo cliente" modal', () => {
    render(<LeadsOverview leads={[]} vehicles={[]} vehicleOptions={VEHICLE_OPTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /novo cliente/i }))
    expect(screen.getByRole('dialog', { name: /novo cliente/i })).toBeInTheDocument()
  })
})
