import { render, screen, act, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

describe('Header', () => {
  it('shows the logo and links to every site section, plus WhatsApp', () => {
    render(<Header />)
    expect(screen.getByAltText(/aguiar veículos/i)).toHaveAttribute('src', '/images/logos/logo-horizontal-transparente.png')
    expect(screen.getByRole('link', { name: 'Página Inicial' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Nossos Veículos' })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: 'Simule' })).toHaveAttribute('href', '/financiamento')
    expect(screen.getByRole('link', { name: 'Empresa' })).toHaveAttribute('href', '/#quinze-anos')
    expect(screen.getByRole('link', { name: 'Como chegar' })).toHaveAttribute('href', '/#como-chegar')
    expect(screen.queryByRole('link', { name: 'Diferenciais' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/#contato')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })

  it('floats as a rounded bar instead of filling the whole top of the page', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).not.toHaveClass('bg-graphite')
    expect(screen.getByTestId('header-bar')).toHaveClass('rounded-2xl')
  })

  it('starts transparent on the home page', () => {
    render(<Header />)
    expect(screen.getByTestId('header-bar')).toHaveClass('bg-transparent')
  })

  it('turns into frosted glass after scrolling, not solid black', () => {
    render(<Header />)
    const bar = screen.getByTestId('header-bar')

    act(() => {
      window.scrollY = 100
      window.dispatchEvent(new Event('scroll'))
    })
    expect(bar).toHaveClass('backdrop-blur-md')
    expect(bar).toHaveClass('bg-graphite/60')
    expect(bar).not.toHaveClass('bg-graphite')
    expect(bar).not.toHaveClass('bg-transparent')
  })

  it('keeps the glass look with the mobile menu open, and the menu lives inside the same rounded bar', () => {
    render(<Header />)
    const bar = screen.getByTestId('header-bar')
    fireEvent.click(screen.getByLabelText(/abrir menu/i))
    expect(bar).toHaveClass('backdrop-blur-md')
    expect(bar).toContainElement(document.getElementById('mobile-menu'))
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

  it('wraps the store information in a rounded, bordered panel', () => {
    render(<Footer />)
    const panel = screen.getByTestId('footer-panel')
    expect(panel).toHaveClass('rounded-3xl')
    expect(panel).toHaveClass('border')
    expect(panel).toContainElement(screen.getByRole('link', { name: 'Nossos Veículos' }))
    expect(panel).toContainElement(screen.getByText(/Av\. Campo Dantas, 1689/))
  })

  it('uses the new brand line', () => {
    render(<Footer />)
    expect(screen.getByText('Realizando sonhos sobre quatro rodas.')).toBeInTheDocument()
    expect(screen.queryByText(/procedência, confiança e compromisso em cada venda/i)).not.toBeInTheDocument()
  })

  it('links to the how-to-get-there section instead of the missing Diferenciais one', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Como chegar' })).toHaveAttribute('href', '/#como-chegar')
    expect(screen.queryByRole('link', { name: 'Diferenciais' })).not.toBeInTheDocument()
  })

  it('is where the contact link lands, listing every way to reach the store by name, not by number', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer#contato')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Telefone' })).toHaveAttribute('href', 'tel:+5598991030107')
    expect(screen.getByRole('link', { name: 'E-mail' })).toHaveAttribute('href', 'mailto:aguiarveiculospdutra@hotmail.com')
    expect(screen.queryByText(/99103-0107/)).not.toBeInTheDocument()
    expect(screen.queryByText(/hotmail\.com/)).not.toBeInTheDocument()
    expect(screen.getByText(/Sábado, 8h às 13h/)).toBeInTheDocument()
  })

  it('shows a map right under the logo that grows to end level with the tallest column', () => {
    render(<Footer />)
    const logo = screen.getByAltText('Aguiar Veículos')
    const map = screen.getByTitle('Mapa até a Aguiar Veículos')
    expect(map).toHaveAttribute('src', expect.stringContaining('output=embed'))
    expect(logo.parentElement).toContainElement(map)
    expect(map).toHaveClass('h-full')
    expect(map.parentElement).toHaveClass('flex-1')
    expect(map.parentElement).toHaveClass('max-w-xs')
  })

  it('is the same near-black gray as the page, with light text and the white logo', () => {
    const { container } = render(<Footer />)
    const footer = container.querySelector('footer')!
    expect(footer).toHaveClass('bg-charcoal', 'text-white/70')
    expect(footer).not.toHaveClass('bg-paper')
    expect(footer).not.toHaveClass('bg-graphite')
    expect(screen.getByAltText('Aguiar Veículos')).toHaveAttribute('src', '/images/logos/logo-horizontal-transparente.png')
    expect(screen.getByRole('link', { name: 'Nossos Veículos' })).toHaveClass('text-white')
    expect(screen.getByTestId('footer-panel')).toHaveClass('border-white/15')
  })
})
