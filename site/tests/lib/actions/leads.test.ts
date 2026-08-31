import { describe, it, expect, vi } from 'vitest'
import { createLead } from '@/lib/actions/leads'

describe('createLead', () => {
  it('inserts a lead row without reading it back', async () => {
    const chain: any = {
      insert: vi.fn(async () => ({ error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    await createLead(client as any, {
      type: 'financing', name: 'Maria', phone: '98999999999', details: { downPayment: '5000' },
    })
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.insert).toHaveBeenCalledWith({
      type: 'financing', name: 'Maria', phone: '98999999999',
      details: { downPayment: '5000' }, vehicle_id: null,
    })
  })

  it('throws when the insert fails', async () => {
    const chain: any = {
      insert: vi.fn(async () => ({ error: { message: 'row-level security violation' } })),
    }
    const client = { from: vi.fn(() => chain) }
    await expect(
      createLead(client as any, { type: 'trade_in', name: 'João', phone: '', details: {} }),
    ).rejects.toEqual({ message: 'row-level security violation' })
  })
})
