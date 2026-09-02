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
      stage: 'novo', first_contact_at: null, store_visit_at: null,
      scheduled_visit_date: null, scheduled_visit_time: null,
    })
  })

  it('honors an explicit stage and follow-up dates', async () => {
    const chain: any = { insert: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await createLead(client as any, {
      type: 'manual', name: 'Ana', phone: '98988888888', details: {},
      stage: 'visita_marcada', scheduledVisitDate: '2026-09-10', scheduledVisitTime: '14:00',
    })
    expect(chain.insert).toHaveBeenCalledWith({
      type: 'manual', name: 'Ana', phone: '98988888888',
      details: {}, vehicle_id: null,
      stage: 'visita_marcada', first_contact_at: null, store_visit_at: null,
      scheduled_visit_date: '2026-09-10', scheduled_visit_time: '14:00',
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
