import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ auth: { signOut: vi.fn(async () => ({ error: null })) } }),
}))

import { AdminTopbar } from '@/components/admin/AdminTopbar'

describe('AdminTopbar', () => {
  it("shows the logged-in admin's email, initials, and a logout button", () => {
    render(<AdminTopbar userEmail="dono@aguiarveiculos.com.br" />)
    expect(screen.getByText('dono@aguiarveiculos.com.br')).toBeInTheDocument()
    expect(screen.getByText('DO')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('falls back to "Administrador" when no email is available', () => {
    render(<AdminTopbar userEmail={null} />)
    expect(screen.getAllByText('Administrador').length).toBeGreaterThan(0)
  })

  it('renders a search input', () => {
    render(<AdminTopbar userEmail={null} />)
    expect(screen.getByRole('searchbox', { name: /buscar/i })).toBeInTheDocument()
  })
})
