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

  it('renders the chart without throwing when there are leads', () => {
    const leads = [makeLead({ id: '1', stage: 'novo' }), makeLead({ id: '2', stage: 'negociando' })]
    render(<LeadFunnelChart leads={leads} />)
    expect(screen.getByText('Funil')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum cliente no funil ainda.')).not.toBeInTheDocument()
  })
})
