import { render, screen } from '@testing-library/react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

describe('Header', () => {
  it('links to the catalog and to WhatsApp', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })
})

describe('Footer', () => {
  it('shows the store address and Instagram handle', () => {
    render(<Footer />)
    expect(screen.getByText(/Presidente Dutra/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /@aguiarveiculospk/i })).toHaveAttribute(
      'href',
      'https://www.instagram.com/aguiarveiculospk',
    )
  })
})
