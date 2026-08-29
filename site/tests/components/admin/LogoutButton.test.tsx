import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { push, refresh, signOut } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ auth: { signOut } }),
}))

import { LogoutButton } from '@/components/admin/LogoutButton'

describe('LogoutButton', () => {
  beforeEach(() => { push.mockClear(); refresh.mockClear(); signOut.mockClear() })

  it('signs out and sends the user back to the login page', async () => {
    render(<LogoutButton />)
    fireEvent.click(screen.getByRole('button', { name: /sair/i }))
    await waitFor(() => expect(signOut).toHaveBeenCalled())
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/login'))
    expect(refresh).toHaveBeenCalled()
  })
})
