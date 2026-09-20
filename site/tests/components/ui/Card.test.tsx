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
})
