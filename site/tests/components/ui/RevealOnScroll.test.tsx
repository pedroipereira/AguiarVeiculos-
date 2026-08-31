import { render, screen } from '@testing-library/react'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'

describe('RevealOnScroll', () => {
  it('renders its children', () => {
    render(
      <RevealOnScroll>
        <p>conteúdo revelado</p>
      </RevealOnScroll>,
    )
    expect(screen.getByText('conteúdo revelado')).toBeInTheDocument()
  })

  it('becomes visible immediately when IntersectionObserver is unavailable (e.g. this test environment)', () => {
    render(
      <RevealOnScroll>
        <p>conteúdo revelado</p>
      </RevealOnScroll>,
    )
    const wrapper = screen.getByText('conteúdo revelado').parentElement
    expect(wrapper).toHaveClass('opacity-100')
  })
})
