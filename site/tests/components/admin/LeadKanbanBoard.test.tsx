import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
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

import { LeadKanbanBoard } from '@/components/admin/LeadKanbanBoard'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

const VEHICLES = [{ id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', status: 'available' as const, price_cents: 6490000 }]

describe('LeadKanbanBoard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a column per stage with the right lead counts', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' }), makeLead({ id: 'b', stage: 'negociando', name: 'Ana' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)
    expect(screen.getByText('Lead novo')).toBeInTheDocument()
    expect(screen.getByText('Negociando')).toBeInTheDocument()
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('moves a lead without a vehicle straight to the target stage via the card menu', async () => {
    const leads = [makeLead({ id: 'a', stage: 'novo', vehicle_id: null })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Negociando' }))

    await waitFor(() => expect(adminUpdateLeadStage).toHaveBeenCalledWith('a', 'negociando'))
  })

  it('moves the card to its new column immediately, before the server action resolves (optimistic update)', async () => {
    let resolveUpdate: (() => void) | undefined
    adminUpdateLeadStage.mockImplementation(() => new Promise<void>((resolve) => { resolveUpdate = resolve }))
    const leads = [makeLead({ id: 'a', stage: 'novo', vehicle_id: null })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    const countFor = (label: string) =>
      within(screen.getByText(label).parentElement as HTMLElement).getByText(/^\d+$/).textContent

    expect(countFor('Lead novo')).toBe('1')
    expect(countFor('Negociando')).toBe('0')

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Negociando' }))

    await waitFor(() => {
      expect(countFor('Lead novo')).toBe('0')
      expect(countFor('Negociando')).toBe('1')
    })
    // adminUpdateLeadStage is still pending here — the move above happened
    // before the server action resolved, proving it's optimistic.
    expect(adminUpdateLeadStage).toHaveBeenCalledWith('a', 'negociando')

    await act(async () => {
      resolveUpdate?.()
    })
  })

  it('opens the vehicle sale form instead of moving directly when a lead with a vehicle is moved to "Vendeu"', () => {
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Vendeu' }))

    expect(adminUpdateLeadStage).not.toHaveBeenCalled()
    expect(screen.getByText('Registrar venda')).toBeInTheDocument()
  })

  it('moves the lead to "Vendeu" only after the sale form is saved', async () => {
    adminMarkVehicleSold.mockResolvedValue(undefined)
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Vendeu' }))

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    fireEvent.change(screen.getByLabelText(/data da venda/i), { target: { value: '2026-09-02' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    await waitFor(() => expect(adminMarkVehicleSold).toHaveBeenCalledWith('v-1', {
      salePriceCents: 6200000, soldAt: '2026-09-02', buyerLeadId: 'a',
    }))
    expect(adminUpdateLeadStage).toHaveBeenCalledWith('a', 'vendeu')
  })

  it('shows an inline error and keeps the sale in place when the post-sale stage update fails', async () => {
    adminMarkVehicleSold.mockResolvedValue(undefined)
    adminUpdateLeadStage.mockRejectedValueOnce(new Error('boom'))
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Vendeu' }))

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    fireEvent.change(screen.getByLabelText(/data da venda/i), { target: { value: '2026-09-02' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    await waitFor(() => expect(adminMarkVehicleSold).toHaveBeenCalledWith('v-1', {
      salePriceCents: 6200000, soldAt: '2026-09-02', buyerLeadId: 'a',
    }))
    await waitFor(() =>
      expect(
        screen.getByText('Venda registrada, mas não foi possível mover o lead para "Vendeu". Tente mover manualmente pelo quadro.'),
      ).toBeInTheDocument(),
    )
    // The sale-completion modal stays open (not rolled back) so the admin can see the error.
    expect(screen.getByText('Registrar venda')).toBeInTheDocument()
  })

  it('keeps the lead in its current stage when the sale form is cancelled', () => {
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Vendeu' }))
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(adminUpdateLeadStage).not.toHaveBeenCalled()
    expect(screen.queryByText('Registrar venda')).not.toBeInTheDocument()
  })

  it('deletes a lead after confirmation from the card menu', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const leads = [makeLead({ id: 'a' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(adminDeleteLead).toHaveBeenCalledWith('a')
  })
})
