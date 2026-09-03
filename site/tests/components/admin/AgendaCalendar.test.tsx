import { render, screen, fireEvent } from '@testing-library/react'
import { AgendaCalendar } from '@/components/admin/AgendaCalendar'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'visita_marcada', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, callback_at: null, callback_time: null,
    notes: null, created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('AgendaCalendar', () => {
  it('shows a scheduled visit on its day, opens the day list on click, and links to the lead', () => {
    const leads = [makeLead({ scheduled_visit_date: '2026-09-10', scheduled_visit_time: '14:00' })]
    render(<AgendaCalendar leads={leads} initialMonth="2026-09" />)

    fireEvent.click(screen.getByRole('button', { name: '10' }))
    expect(screen.getByText(/Maria/)).toBeInTheDocument()
    expect(screen.getByText(/às 14:00/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver cliente/i })).toHaveAttribute('href', '/admin/leads')
  })

  it('does not render a day with no events as a clickable button', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-04" />)
    expect(screen.queryByRole('button', { name: '10' })).not.toBeInTheDocument()
  })

  it('shows a commercial date with no "Ver cliente" link', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-09" />)
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(screen.getByText(/Dia do Cliente/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ver cliente/i })).not.toBeInTheDocument()
  })

  it('navigates to the next month and recomputes events', () => {
    const leads = [makeLead({ scheduled_visit_date: '2026-10-05' })]
    render(<AgendaCalendar leads={leads} initialMonth="2026-09" />)

    expect(screen.getByText('Setembro 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(screen.getByText('Outubro 2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(screen.getByText(/Maria/)).toBeInTheDocument()
  })

  it('navigates to the previous month', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-09" />)
    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(screen.getByText('Agosto 2026')).toBeInTheDocument()
  })
})
