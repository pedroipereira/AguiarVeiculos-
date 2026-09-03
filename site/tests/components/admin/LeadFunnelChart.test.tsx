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

// Each row is <p label /><div track><div fill/></div></div><p count />.
function getRow(label: string): HTMLElement {
  return screen.getByText(label).parentElement as HTMLElement
}

function getRowCount(label: string): string | null {
  const row = getRow(label)
  return (row.lastElementChild as HTMLElement).textContent
}

function getFillWidthPercent(label: string): number {
  const track = getRow(label).children[1] as HTMLElement
  const fill = track.firstElementChild as HTMLElement | null
  return fill ? parseFloat(fill.style.width) : 0
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
    expect(getRowCount('Lead novo')).toBe('2')
    expect(getRowCount('Visita marcada')).toBe('0')
    expect(getRowCount('Negociando')).toBe('1')
    expect(getRowCount('Ligar de volta')).toBe('0')
    expect(getRowCount('Vendeu')).toBe('0')
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

    expect(getFillWidthPercent('Ligar de volta')).toBeGreaterThan(getFillWidthPercent('Negociando'))
  })

  it('renders an empty track with no fill for a stage with zero leads', () => {
    const leads = [makeLead({ id: '1', stage: 'novo' })]
    render(<LeadFunnelChart leads={leads} />)
    expect(getFillWidthPercent('Vendeu')).toBe(0)
  })
})
