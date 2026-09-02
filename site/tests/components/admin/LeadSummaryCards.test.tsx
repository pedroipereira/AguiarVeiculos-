import { render, screen } from '@testing-library/react'
import { LeadSummaryCards } from '@/components/admin/LeadSummaryCards'

describe('LeadSummaryCards', () => {
  it('shows all four counts with their labels', () => {
    render(<LeadSummaryCards activeCount={12} negotiatingCount={3} overdueCount={2} soldCount={5} />)
    expect(screen.getByText('Clientes ativos')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Em negociação')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Retornos atrasados')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Vendas no mês')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
