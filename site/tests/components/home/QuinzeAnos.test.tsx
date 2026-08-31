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
})
