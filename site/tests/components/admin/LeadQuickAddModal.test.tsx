import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminCreateManualLead, adminUpdateLead } = vi.hoisted(() => ({ adminCreateManualLead: vi.fn(), adminUpdateLead: vi.fn() }))
vi.mock('@/app/actions/leads', () => ({ adminCreateManualLead, adminUpdateLead }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { LeadQuickAddModal } from '@/components/admin/LeadQuickAddModal'

const VEHICLES = [{ id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', status: 'available' as const, price_cents: 6490000 }]

describe('LeadQuickAddModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the vehicle and its selling price in the "veículo de interesse" options', () => {
    render(<LeadQuickAddModal vehicles={VEHICLES} onClose={vi.fn()} />)
    expect(screen.getByRole('option', { name: 'Fiat Argo Drive - R$ 64.900' })).toBeInTheDocument()
  })

  it('creates a lead with the funnel stage and vehicle picked in the form', async () => {
    const onClose = vi.fn()
    render(<LeadQuickAddModal vehicles={VEHICLES} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Maria' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '98999999999' } })
    fireEvent.change(screen.getByLabelText(/veículo de interesse/i), { target: { value: 'v-1' } })
    fireEvent.change(screen.getByLabelText(/estágio no funil/i), { target: { value: 'negociando' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar lead/i }))

    await waitFor(() =>
      expect(adminCreateManualLead).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Maria', phone: '98999999999', vehicleId: 'v-1', stage: 'negociando' }),
      ),
    )
    expect(refresh).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('defaults to the "novo" stage and omits optional dates when left blank', async () => {
    render(<LeadQuickAddModal vehicles={[]} onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'João' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '98988888888' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar lead/i }))

    await waitFor(() =>
      expect(adminCreateManualLead).toHaveBeenCalledWith({
        name: 'João', phone: '98988888888', vehicleId: undefined, stage: 'novo',
        firstContactAt: undefined, storeVisitAt: undefined, scheduledVisitDate: undefined, scheduledVisitTime: undefined,
      }),
    )
  })

  it('collects the optional follow-up dates via the calendar picker, and the visit time', async () => {
    render(<LeadQuickAddModal vehicles={[]} onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '98977777777' } })

    const now = new Date()
    const isoPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    fireEvent.click(screen.getByLabelText(/primeiro contato/i))
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    fireEvent.click(screen.getByLabelText(/veio na loja/i))
    fireEvent.click(screen.getByRole('button', { name: '10' }))
    fireEvent.click(screen.getByLabelText(/visita marcada/i))
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    fireEvent.change(screen.getByLabelText(/hora da visita/i), { target: { value: '15:30' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar lead/i }))

    await waitFor(() =>
      expect(adminCreateManualLead).toHaveBeenCalledWith(
        expect.objectContaining({
          firstContactAt: `${isoPrefix}-05`,
          storeVisitAt: `${isoPrefix}-10`,
          scheduledVisitDate: `${isoPrefix}-15`,
          scheduledVisitTime: '15:30',
        }),
      ),
    )
  })

  it('closes without saving when Cancelar is clicked', () => {
    const onClose = vi.fn()
    render(<LeadQuickAddModal vehicles={[]} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onClose).toHaveBeenCalled()
    expect(adminCreateManualLead).not.toHaveBeenCalled()
  })

  it('collects observações text on create', async () => {
    render(<LeadQuickAddModal vehicles={[]} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Pedro' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '98911112222' } })
    fireEvent.change(screen.getByLabelText(/observações/i), { target: { value: 'Quer um SUV' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar lead/i }))

    await waitFor(() =>
      expect(adminCreateManualLead).toHaveBeenCalledWith(expect.objectContaining({ notes: 'Quer um SUV' })),
    )
  })

  it('pre-fills the form and calls adminUpdateLead when a lead is provided (edit mode)', async () => {
    const lead = {
      id: 'l-1', type: 'manual', name: 'Carlos', phone: '98977776666', details: null,
      vehicle_id: 'v-1', stage: 'negociando', first_contact_at: '2026-09-01', store_visit_at: null,
      scheduled_visit_date: null, scheduled_visit_time: null, notes: 'Já visitou a loja',
      created_at: '2026-08-01T10:00:00.000Z',
    } as any
    const onClose = vi.fn()
    render(<LeadQuickAddModal vehicles={VEHICLES} lead={lead} onClose={onClose} />)

    expect(screen.getByText('Editar lead')).toBeInTheDocument()
    expect(screen.getByLabelText(/^nome$/i)).toHaveValue('Carlos')
    expect(screen.getByLabelText(/telefone/i)).toHaveValue('98977776666')
    expect(screen.getByLabelText(/observações/i)).toHaveValue('Já visitou a loja')

    fireEvent.click(screen.getByRole('button', { name: /salvar lead/i }))

    await waitFor(() =>
      expect(adminUpdateLead).toHaveBeenCalledWith('l-1', expect.objectContaining({ name: 'Carlos', notes: 'Já visitou a loja' })),
    )
    expect(onClose).toHaveBeenCalled()
    expect(adminCreateManualLead).not.toHaveBeenCalled()
  })
})
