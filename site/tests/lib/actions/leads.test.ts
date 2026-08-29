import { describe, it, expect, vi } from 'vitest'
import { createLead } from '@/lib/actions/leads'

describe('createLead', () => {
  it('inserts a lead row and returns its id', async () => {
    const chain: any = {
      insert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: { id: 'lead-1' }, error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await createLead(client as any, {
      type: 'financing', name: 'Maria', phone: '98999999999', details: { downPayment: '5000' },
    })
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.insert).toHaveBeenCalledWith({
      type: 'financing', name: 'Maria', phone: '98999999999',
      details: { downPayment: '5000' }, vehicle_id: null,
    })
    expect(result).toEqual({ id: 'lead-1' })
  })
})
