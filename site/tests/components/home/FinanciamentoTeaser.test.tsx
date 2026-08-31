import { render, screen } from '@testing-library/react'
import { FinanciamentoTeaser } from '@/components/home/FinanciamentoTeaser'

describe('FinanciamentoTeaser', () => {
  it('presents both paths as cards linking to the dedicated financing/trade-in page', () => {
    render(<FinanciamentoTeaser />)
    expect(screen.getByRole('heading', { name: /financiamento e avaliação/i })).toBeInTheDocument()
    expect(screen.getByText(/simular financiamento/i)).toBeInTheDocument()
    expect(screen.getByText(/em até 60x, com mais de 10 bancos parceiros/i)).toBeInTheDocument()
    expect(screen.getByText(/avaliar meu usado/i)).toBeInTheDocument()
    expect(screen.getByText(/usamos o valor como entrada na troca/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /simular agora/i })).toHaveAttribute('href', '/financiamento')
    expect(screen.getByRole('link', { name: /avaliar meu carro/i })).toHaveAttribute('href', '/financiamento')
  })
})
