import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('is light gray by default', () => {
    render(<Card>conteúdo</Card>)
    expect(screen.getByText('conteúdo')).toHaveClass('bg-card-gray')
  })

  it('can be white, to stand out from the soft white page', () => {
    render(<Card surface="white">conteúdo</Card>)
    expect(screen.getByText('conteúdo')).toHaveClass('bg-white')
    expect(screen.getByText('conteúdo')).not.toHaveClass('bg-card-gray')
  })

  it('can be a dark panel for black pages: a thin border, a hair lighter than the page, with light text', () => {
    render(<Card surface="dark">conteúdo</Card>)
    const card = screen.getByText('conteúdo')
    expect(card).toHaveClass('bg-white/[0.04]', 'border-white/10', 'text-white')
    expect(card).not.toHaveClass('bg-card-gray', 'text-graphite', 'shadow-sm')
  })
})
