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

  it('keeps the intro line readable on a dark background, and gray on a light one', () => {
    const { unmount } = render(<FinanciamentoTeaser tone="dark" />)
    expect(screen.getByText(/duas formas rápidas/i)).toHaveClass('text-white/70')
    unmount()
    const light = render(<FinanciamentoTeaser tone="light" />)
    expect(screen.getByText(/duas formas rápidas/i)).toHaveClass('text-support-gray')
    light.unmount()
    render(<FinanciamentoTeaser tone="light-soft" />)
    expect(screen.getByText(/duas formas rápidas/i)).toHaveClass('text-graphite/70')
  })

  it('lights the top edge of both cards in red on hover, since black would vanish on a black page', () => {
    render(<FinanciamentoTeaser tone="light-soft" />)
    for (const title of [/simular financiamento/i, /avaliar meu usado/i]) {
      expect(screen.getByText(title).parentElement).toHaveClass('hover:border-t-aguiar-red')
    }
  })

  it('uses white cards on the soft white background, so they stand out', () => {
    render(<FinanciamentoTeaser tone="light-soft" />)
    const card = screen.getByText(/simular financiamento/i).parentElement!
    expect(card).toHaveClass('bg-white')
    expect(card).not.toHaveClass('bg-card-gray')
  })
})
