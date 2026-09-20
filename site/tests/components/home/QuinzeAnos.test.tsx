import { render, screen } from '@testing-library/react'
import { QuinzeAnos } from '@/components/home/QuinzeAnos'

describe('QuinzeAnos', () => {
  it('tells the company story, credits the founder, and lists reasons to choose Aguiar', () => {
    render(<QuinzeAnos />)
    expect(screen.getByText(/sobre a aguiar veículos/i)).toBeInTheDocument()
    expect(screen.getByAltText(/antonio aguiar/i)).toBeInTheDocument()
    expect(screen.getByText(/há mais de 15 anos no mesmo endereço/i)).toBeInTheDocument()
    expect(screen.getByText(/90 dias de garantia para motor e câmbio/i)).toBeInTheDocument()
    expect(screen.getByText(/maior estoque da região/i)).toBeInTheDocument()
    expect(screen.getByText(/toda a região do maranhão/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver estoque/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /fale conosco/i })).toBeInTheDocument()
  })

  it('keeps the story and the reasons readable on the dark background', () => {
    render(<QuinzeAnos tone="dark" />)
    for (const text of [/há mais de 15 anos no mesmo endereço/i, /cobertura em motor e câmbio/i]) {
      expect(screen.getByText(text)).toHaveClass('text-white/70')
      expect(screen.getByText(text)).not.toHaveClass('text-support-gray')
    }
  })

  it('keeps the gray text when the section is light', () => {
    render(<QuinzeAnos tone="light" />)
    expect(screen.getByText(/há mais de 15 anos no mesmo endereço/i)).toHaveClass('text-support-gray')
  })

  it('uses a darker gray on the soft white, where the regular gray is too faint', () => {
    render(<QuinzeAnos tone="light-soft" />)
    const paragraph = screen.getByText(/há mais de 15 anos no mesmo endereço/i)
    expect(paragraph).toHaveClass('text-graphite/70')
    expect(screen.getByText(/cobertura em motor e câmbio/i)).toHaveClass('text-graphite/70')
  })

  it('draws the "Fale conosco" button in dark on a light background, and in white on a dark one', () => {
    const light = render(<QuinzeAnos tone="light-soft" />)
    const onLight = screen.getByRole('link', { name: /fale conosco/i })
    expect(onLight).toHaveClass('border-graphite', 'text-graphite')
    expect(onLight).not.toHaveClass('text-white')
    light.unmount()
    render(<QuinzeAnos tone="dark" />)
    expect(screen.getByRole('link', { name: /fale conosco/i })).toHaveClass('border-white', 'text-white')
  })
})
