import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminDeleteLead, adminCreateManualLead, adminUpdateLead } = vi.hoisted(() => ({
  adminDeleteLead: vi.fn(), adminCreateManualLead: vi.fn(), adminUpdateLead: vi.fn(),
}))
vi.mock('@/app/actions/leads', () => ({ adminDeleteLead, adminCreateManualLead, adminUpdateLead }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { DndContext } from '@dnd-kit/core'
import { LeadCard } from '@/components/admin/LeadCard'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '(98) 99999-9999', details: null,
    vehicle_id: 'v-1', stage: 'novo', first_contact_at: '2026-09-01', store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: 'Quer trocar o carro',
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

const VEHICLES = [{ id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', status: 'available' as const, price_cents: 6490000 }]

function renderCard(lead: Lead, onMoveToStage = vi.fn()) {
  return render(
    <DndContext onDragEnd={() => {}}>
      <LeadCard lead={lead} vehicles={VEHICLES} onMoveToStage={onMoveToStage} />
    </DndContext>,
  )
}

describe('LeadCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows name, phone, linked vehicle, notes, and dates', () => {
    renderCard(makeLead())
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('(98) 99999-9999')).toBeInTheDocument()
    expect(screen.getByText(/Fiat Argo Drive/)).toBeInTheDocument()
    expect(screen.getByText('Quer trocar o carro')).toBeInTheDocument()
    expect(screen.getByText(/Primeiro contato: 01\/09\/2026/)).toBeInTheDocument()
  })

  it('links the WhatsApp button to the lead\'s number', () => {
    renderCard(makeLead())
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', 'https://wa.me/5598999999999')
  })

  it('calls onMoveToStage with the chosen stage from the "..." menu', () => {
    const onMoveToStage = vi.fn()
    renderCard(makeLead({ stage: 'novo' }), onMoveToStage)
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Negociando' }))
    expect(onMoveToStage).toHaveBeenCalledWith('negociando')
  })

  it('does not offer moving to the lead\'s current stage', () => {
    renderCard(makeLead({ stage: 'novo' }))
    fireEvent.click(screen.getByLabelText('Mais opções'))
    expect(screen.queryByRole('button', { name: 'Lead novo' })).not.toBeInTheDocument()
  })

  it('deletes the lead after confirming', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderCard(makeLead({ id: 'l-9' }))
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(adminDeleteLead).toHaveBeenCalledWith('l-9')
  })

  it('does not delete when the confirmation is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderCard(makeLead())
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(adminDeleteLead).not.toHaveBeenCalled()
  })

  it('opens the edit modal pre-filled when "Editar" is clicked', () => {
    renderCard(makeLead({ name: 'Maria' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByText('Editar lead')).toBeInTheDocument()
    expect(screen.getByLabelText(/^nome$/i)).toHaveValue('Maria')
  })

  it('closes the "..." menu when clicking anywhere outside it', () => {
    renderCard(makeLead())
    fireEvent.click(screen.getByLabelText('Mais opções'))
    expect(screen.getByText('Mover para')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Mover para')).not.toBeInTheDocument()
  })

  it('does not close the menu when clicking inside it', () => {
    renderCard(makeLead())
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.mouseDown(screen.getByText('Mover para'))
    expect(screen.getByText('Mover para')).toBeInTheDocument()
  })

  it('shows a colored left border matching the stage accent', () => {
    const { container } = renderCard(makeLead({ stage: 'vendeu' }))
    expect(container.firstChild).toHaveClass('border-green-600')
  })
})
