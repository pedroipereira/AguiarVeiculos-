import { describe, it, expect, vi } from 'vitest'
import { getAllLeadsAdmin } from '@/lib/queries/leads'

describe('getAllLeadsAdmin', () => {
  it('queries leads ordered by most recent first', async () => {
    const chain: any = { select: vi.fn(() => chain), order: vi.fn(async () => ({ data: [{ id: 'l-1', type: 'financing' }], error: null })) }
    const client = { from: vi.fn(() => chain) }
    const result = await getAllLeadsAdmin(client as any)
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([{ id: 'l-1', type: 'financing' }])
  })
})
