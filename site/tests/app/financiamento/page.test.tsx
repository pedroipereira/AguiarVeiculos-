import { render, screen } from '@testing-library/react'
import FinanciamentoPage from '@/app/(public)/financiamento/page'

describe('/financiamento page', () => {
  it('renders both the financing and trade-in forms', () => {
    render(<FinanciamentoPage />)
    expect(screen.getByRole('heading', { name: /simular financiamento/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /avaliar meu carro para troca/i })).toBeInTheDocument()
  })
})
