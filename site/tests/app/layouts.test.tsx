import { render, screen } from '@testing-library/react'
import PublicLayout from '@/app/(public)/layout'

describe('(public) layout', () => {
  it('wraps public pages with the public Header and Footer', () => {
    render(<PublicLayout><main>conteúdo público</main></PublicLayout>)
    expect(screen.getByRole('link', { name: /ver estoque/i })).toBeInTheDocument()
    expect(screen.getByText(/Presidente Dutra/i)).toBeInTheDocument()
    expect(screen.getByText('conteúdo público')).toBeInTheDocument()
  })
})
