import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const signInWithPassword = vi.fn(async () => ({ error: null }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ auth: { signInWithPassword } }),
}))

import LoginPage from '@/app/admin/login/page'

describe('/admin/login', () => {
  it('signs in and redirects to /admin on success', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'admin@aguiarveiculos.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'senha-forte' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@aguiarveiculos.com', password: 'senha-forte',
    }))
    expect(push).toHaveBeenCalledWith('/admin')
  })

  it('shows an error message on failed login', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } } as any)
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'admin@aguiarveiculos.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/e-mail ou senha inválidos/i)).toBeInTheDocument()
  })
})
