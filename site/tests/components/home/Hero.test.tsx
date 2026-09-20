import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/home/Hero'

describe('Hero', () => {
  it('shows the eyebrow, headline with the highlighted word, and both CTAs', () => {
    render(<Hero />)
    expect(screen.getByText(/aguiar veículos • novos e seminovos/i)).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/confiança/i)
    expect(screen.getByText('confiança.')).toHaveClass('text-aguiar-red')
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })

  it('keeps the paragraph over the photo readable: light text, not the dim gray', () => {
    render(<Hero />)
    const paragraph = screen.getByText(/cada carro é escolhido com cuidado/i)
    expect(paragraph).toHaveClass('text-white/90')
    expect(paragraph).not.toHaveClass('text-support-gray')
  })

  it('fades its bottom edge into the page black, so the photo blends into the next section', () => {
    render(<Hero />)
    const fade = screen.getByTestId('hero-fade')
    expect(fade).toHaveClass('bg-gradient-to-b', 'from-transparent', 'to-graphite', 'bottom-0')
    expect(fade).toHaveAttribute('aria-hidden', 'true')
    expect(fade).toHaveClass('pointer-events-none')
  })
})
