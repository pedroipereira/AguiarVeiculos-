import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

describe('Header', () => {
  it('shows the logo and links to every site section, plus WhatsApp', () => {
    render(<Header />)
    expect(screen.getByAltText(/aguiar veículos/i)).toHaveAttribute('src', '/images/logo-full.png')
    expect(screen.getByRole('link', { name: 'Página Inicial' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Nossos Veículos' })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: 'Simule' })).toHaveAttribute('href', '/financiamento')
    expect(screen.getByRole('link', { name: 'Empresa' })).toHaveAttribute('href', '/#quinze-anos')
    expect(screen.getByRole('link', { name: 'Diferenciais' })).toHaveAttribute('href', '/#diferenciais')
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/#contato')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })

  it('starts transparent on the home page and turns solid after scrolling', () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-transparent')

    act(() => {
      window.scrollY = 100
      window.dispatchEvent(new Event('scroll'))
    })
    expect(header).toHaveClass('bg-graphite')
  })
})

describe('Footer', () => {
  it('shows the store address, social links, and a link to financing', () => {
    render(<Footer />)
    expect(screen.getAllByText(/Presidente Dutra/i).length).toBeGreaterThan(0)
    const instagramLinks = screen.getAllByRole('link', { name: /instagram/i })
    expect(instagramLinks.some((link) => link.getAttribute('href') === 'https://www.instagram.com/aguiarveiculospk')).toBe(
      true,
    )
    const whatsappLinks = screen.getAllByRole('link', { name: /whatsapp/i })
    expect(whatsappLinks.some((link) => link.getAttribute('href')?.includes('wa.me'))).toBe(true)
    expect(screen.getByRole('link', { name: /financiamento e avaliação/i })).toHaveAttribute('href', '/financiamento')
  })
})
