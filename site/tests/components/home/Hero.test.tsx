import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/home/Hero'

describe('Hero', () => {
  it('shows the eyebrow, headline with the highlighted word, and both CTAs', () => {
    render(<Hero />)
    expect(screen.getByText(/aguiar veículos • novos e semi-novos/i)).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/confiança/i)
    expect(screen.getByText('confiança.')).toHaveClass('text-aguiar-red')
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })
})
