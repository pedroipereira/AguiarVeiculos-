import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

import PublicLayout from '@/app/(public)/layout'

describe('(public) layout', () => {
  it('wraps public pages with the public Header and Footer', () => {
    render(<PublicLayout><main>conteúdo público</main></PublicLayout>)
    expect(screen.getAllByRole('link', { name: 'Nossos Veículos' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Presidente Dutra/i).length).toBeGreaterThan(0)
    expect(screen.getByText('conteúdo público')).toBeInTheDocument()
  })
})
