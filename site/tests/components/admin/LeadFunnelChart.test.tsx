import { render, screen } from '@testing-library/react'
import { LeadFunnelChart } from '@/components/admin/LeadFunnelChart'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Cliente', phone: '99999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('LeadFunnelChart', () => {
  it('shows an empty state when there are no leads in the funnel', () => {
    render(<LeadFunnelChart leads={[]} />)
    expect(screen.getByText('Nenhum cliente no funil ainda.')).toBeInTheDocument()
  })

  it('shows every funnel stage with its label and count, in funnel order', () => {
    const leads = [
      makeLead({ id: '1', stage: 'novo' }),
      makeLead({ id: '2', stage: 'novo' }),
      makeLead({ id: '3', stage: 'negociando' }),
    ]
    render(<LeadFunnelChart leads={leads} />)
    expect(screen.getByText('Lead novo · 2')).toBeInTheDocument()
    expect(screen.getByText('Visita marcada · 0')).toBeInTheDocument()
    expect(screen.getByText('Negociando · 1')).toBeInTheDocument()
    expect(screen.getByText('Ligar de volta · 0')).toBeInTheDocument()
    expect(screen.getByText('Vendeu · 0')).toBeInTheDocument()
  })

  it('gives a stage with more leads a wider bar, even when a later stage outnumbers an earlier one', () => {
    // "Ligar de volta" (3) outnumbering "Negociando" (1) is exactly the
    // non-monotonic case that broke Recharts' Funnel (it assumes values
    // decrease top-to-bottom and produces crossed/inverted geometry
    // otherwise). Each bar here is sized from its own count only, so this
    // must render as two correctly-proportioned, independent bars.
    const leads = [
      makeLead({ id: '1', stage: 'negociando' }),
      makeLead({ id: '2', stage: 'ligar_de_volta' }),
      makeLead({ id: '3', stage: 'ligar_de_volta' }),
      makeLead({ id: '4', stage: 'ligar_de_volta' }),
    ]
    render(<LeadFunnelChart leads={leads} />)

    const negociandoBar = screen.getByText('Negociando · 1').previousElementSibling as HTMLElement
    const ligarBar = screen.getByText('Ligar de volta · 3').previousElementSibling as HTMLElement

    const negociandoWidth = parseFloat(negociandoBar.style.width)
    const ligarWidth = parseFloat(ligarBar.style.width)
    expect(ligarWidth).toBeGreaterThan(negociandoWidth)
  })

  it('renders no bar for a stage with zero leads', () => {
    const leads = [makeLead({ id: '1', stage: 'novo' })]
    render(<LeadFunnelChart leads={leads} />)
    const vendeuRow = screen.getByText('Vendeu · 0').parentElement as HTMLElement
    expect(vendeuRow.querySelector('div[style]')).toBeNull()
  })
})
