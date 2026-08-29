import { render, screen } from '@testing-library/react'
import { PorQueAguiar } from '@/components/home/PorQueAguiar'

describe('PorQueAguiar', () => {
  it('renders the three trust pillars', () => {
    render(<PorQueAguiar />)
    expect(screen.getByText(/procedência e transparência/i)).toBeInTheDocument()
    expect(screen.getByText(/financiamento facilitado/i)).toBeInTheDocument()
    expect(screen.getByText(/clientes que voltam/i)).toBeInTheDocument()
  })
})
