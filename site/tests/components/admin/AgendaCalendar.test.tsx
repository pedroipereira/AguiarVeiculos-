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

const NOW = new Date(2026, 8, 1) // Tuesday, September 1st 2026

describe('AgendaCalendar', () => {
  it('shows the four stat cards', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-09" now={NOW} />)
    expect(screen.getByText('Visitas hoje')).toBeInTheDocument()
    expect(screen.getByText('Retornos hoje')).toBeInTheDocument()
    expect(screen.getByText('Próximos 7 dias')).toBeInTheDocument()
    expect(screen.getByText('Retornos atrasados')).toBeInTheDocument()
  })

  it('defaults the side panel to today, showing the empty state when nothing is scheduled', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-09" now={NOW} />)
    expect(screen.getByText('hoje')).toBeInTheDocument()
    expect(screen.getByText('Nada agendado nesse dia.')).toBeInTheDocument()
  })

  it('shows a scheduled visit as a pill on its day, selects it on click, and lists it in the panel with a link to the lead', () => {
    const leads = [makeLead({ scheduled_visit_date: '2026-09-10', scheduled_visit_time: '14:00' })]
    render(<AgendaCalendar leads={leads} initialMonth="2026-09" now={NOW} />)

    expect(screen.getByText('Maria')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '10' }))
    // The pill (grid) and the panel's list item both contain "Maria" — the
    // panel's text node is merged with " às 14:00" by adjacent-sibling text
    // concatenation, so match with a substring regex, not an exact string.
    expect(screen.getAllByText(/Maria/).length).toBeGreaterThan(1)
    expect(screen.getByText(/às 14:00/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver cliente/i })).toHaveAttribute('href', '/admin/leads')
  })

  it('selecting a day with no events shows the empty state in the panel', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-09" now={NOW} />)
    fireEvent.click(screen.getByRole('button', { name: '10' }))
    expect(screen.getByText('Nada agendado nesse dia.')).toBeInTheDocument()
  })

  it('shows a commercial date pill with no "Ver cliente" link', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-09" now={NOW} />)
    expect(screen.getByText('Dia do Cliente')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(screen.queryByRole('link', { name: /ver cliente/i })).not.toBeInTheDocument()
  })

  it('shows a +N indicator when a day has more events than fit', () => {
    const leads = [
      makeLead({ id: 'a', name: 'Ana', scheduled_visit_date: '2026-09-15' }),
      makeLead({ id: 'b', name: 'Bruno', stage: 'ligar_de_volta', callback_at: '2026-09-15' }),
    ]
    render(<AgendaCalendar leads={leads} initialMonth="2026-09" now={NOW} />)
    // Sept 15 already has "Dia do Cliente" (comercial) — adding a visita and a
    // retorno makes 3 events that day, one over the 2-pill cap.
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('navigates to the next month and recomputes the grid', () => {
    const leads = [makeLead({ scheduled_visit_date: '2026-10-05' })]
    render(<AgendaCalendar leads={leads} initialMonth="2026-09" now={NOW} />)

    expect(screen.getByText('Setembro 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(screen.getByText('Outubro 2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '5' }))
    expect(screen.getAllByText(/Maria/).length).toBeGreaterThan(1)
  })

  it('navigates to the previous month', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-09" now={NOW} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(screen.getByText('Agosto 2026')).toBeInTheDocument()
  })

  it('the Hoje button returns to the current month and resets the selection to today', () => {
    render(<AgendaCalendar leads={[]} initialMonth="2026-01" now={NOW} />)
    expect(screen.getByText('Janeiro 2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(screen.getByText('Setembro 2026')).toBeInTheDocument()
    expect(screen.getByText('hoje')).toBeInTheDocument()
  })
})
