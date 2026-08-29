import { render, screen } from '@testing-library/react'
import { Diferenciais } from '@/components/home/Diferenciais'

describe('Diferenciais', () => {
  it('renders all five differentiators from marketing/estrategia.md', () => {
    render(<Diferenciais />)
    expect(screen.getByText(/procedência garantida/i)).toBeInTheDocument()
    expect(screen.getByText(/financiamento em até 60x/i)).toBeInTheDocument()
    expect(screen.getByText('Mais de 10 bancos parceiros')).toBeInTheDocument()
    expect(screen.getByText(/aceita seu carro ou moto na troca/i)).toBeInTheDocument()
    expect(screen.getByText(/revisados e higienizados/i)).toBeInTheDocument()
  })
})
