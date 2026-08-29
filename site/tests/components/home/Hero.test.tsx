import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/home/Hero'

describe('Hero', () => {
  it('shows the brand headline and both CTAs', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/aguiar veículos/i)
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })
})
