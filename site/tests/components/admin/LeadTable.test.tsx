import { render, screen } from '@testing-library/react'
import { LeadTable } from '@/components/admin/LeadTable'

const leads = [
  { id: 'l-1', type: 'financing', name: 'Maria', phone: '98999999999', details: { downPayment: '5000' }, vehicle_id: null, created_at: '2026-08-28T10:00:00Z' },
  { id: 'l-2', type: 'trade_in', name: 'João', phone: '98988888888', details: { brand: 'Chevrolet', model: 'Onix' }, vehicle_id: null, created_at: '2026-08-27T10:00:00Z' },
] as any

describe('LeadTable', () => {
  it('lists leads with name, phone, and type label', () => {
    render(<LeadTable leads={leads} />)
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText(/financiamento/i)).toBeInTheDocument()
    expect(screen.getByText('João')).toBeInTheDocument()
    expect(screen.getByText(/avaliação de usado/i)).toBeInTheDocument()
  })
})
