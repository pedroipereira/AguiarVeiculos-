import { describe, it, expect, vi } from 'vitest'
import { assertAdmin } from '@/lib/actions/assert-admin'

describe('assertAdmin', () => {
  it('throws when there is no authenticated user', async () => {
    const client = { auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) } }
    await expect(assertAdmin(client as any)).rejects.toThrow('Não autenticado.')
  })

  it('resolves for an authenticated user', async () => {
    const client = { auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u-1' } }, error: null })) } }
    await expect(assertAdmin(client as any)).resolves.toBeUndefined()
  })
})
