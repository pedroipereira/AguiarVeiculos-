import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ browser: true })),
  createServerClient: vi.fn(() => ({ server: true })),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}))

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
})

describe('supabase clients', () => {
  it('creates a browser client using env vars', async () => {
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/browser')
    const client = createBrowserSupabaseClient()
    expect(client).toEqual({ browser: true })
  })

  it('creates a server client using env vars and cookies', async () => {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const client = await createServerSupabaseClient()
    expect(client).toEqual({ server: true })
  })
})
