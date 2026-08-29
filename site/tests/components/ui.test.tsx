import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

describe('UI primitives', () => {
  it('Button primary variant uses the Aguiar Red background', () => {
    render(<Button variant="primary">Ver estoque</Button>)
    expect(screen.getByRole('button', { name: 'Ver estoque' })).toHaveClass('bg-aguiar-red')
  })

  it('Card renders children on a Card Gray background', () => {
    render(<Card>conteúdo</Card>)
    expect(screen.getByText('conteúdo')).toHaveClass('bg-card-gray')
  })

  it('Section renders an eyebrow and a title', () => {
    render(<Section eyebrow="Diferenciais" title="Por que a Aguiar Veículos">conteúdo</Section>)
    expect(screen.getByText('Diferenciais')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Por que a Aguiar Veículos' })).toBeInTheDocument()
  })

  it('WhatsAppButton links to a wa.me URL with the given message', () => {
    render(<WhatsAppButton message="Olá!">Fale conosco</WhatsAppButton>)
    expect(screen.getByRole('link', { name: 'Fale conosco' })).toHaveAttribute(
      'href',
      'https://wa.me/5598991030107?text=Ol%C3%A1!',
    )
  })
})
