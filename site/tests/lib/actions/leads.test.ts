import { describe, it, expect, vi } from 'vitest'
import { createLead, updateLead, updateLeadStage, deleteLead } from '@/lib/actions/leads'

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
      stage: 'novo', notes: null, first_contact_at: null, store_visit_at: null,
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
      stage: 'visita_marcada', notes: null, first_contact_at: null, store_visit_at: null,
      scheduled_visit_date: '2026-09-10', scheduled_visit_time: '14:00',
    })
  })

  it('includes notes in the insert payload when provided', async () => {
    const chain: any = { insert: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await createLead(client as any, {
      type: 'manual', name: 'Carlos', phone: '98977777777', details: {},
      notes: 'Ligar segunda-feira',
    })
    expect(chain.insert).toHaveBeenCalledWith({
      type: 'manual', name: 'Carlos', phone: '98977777777',
      details: {}, vehicle_id: null,
      stage: 'novo', notes: 'Ligar segunda-feira', first_contact_at: null, store_visit_at: null,
      scheduled_visit_date: null, scheduled_visit_time: null,
    })
  })

  it('writes notes: null when notes is omitted', async () => {
    const chain: any = { insert: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await createLead(client as any, {
      type: 'trade_in', name: 'Sofia', phone: '98966666666', details: {},
    })
    expect(chain.insert).toHaveBeenCalledWith({
      type: 'trade_in', name: 'Sofia', phone: '98966666666',
      details: {}, vehicle_id: null,
      stage: 'novo', notes: null, first_contact_at: null, store_visit_at: null,
      scheduled_visit_date: null, scheduled_visit_time: null,
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

describe('updateLead', () => {
  it('updates the lead row with the given fields', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await updateLead(client as any, 'l-1', {
      name: 'Maria', phone: '98999999999', vehicleId: 'v-1', stage: 'negociando',
      notes: 'Ligar amanhã', firstContactAt: '2026-09-01',
    })
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.update).toHaveBeenCalledWith({
      name: 'Maria', phone: '98999999999', vehicle_id: 'v-1', stage: 'negociando',
      notes: 'Ligar amanhã', first_contact_at: '2026-09-01', store_visit_at: null,
      scheduled_visit_date: null, scheduled_visit_time: null,
    })
    expect(chain.eq).toHaveBeenCalledWith('id', 'l-1')
  })

  it('writes null for vehicle, notes, and dates when omitted, and defaults stage to novo', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await updateLead(client as any, 'l-1', { name: 'João', phone: '98988888888' })
    expect(chain.update).toHaveBeenCalledWith({
      name: 'João', phone: '98988888888', vehicle_id: null, stage: 'novo', notes: null,
      first_contact_at: null, store_visit_at: null, scheduled_visit_date: null, scheduled_visit_time: null,
    })
  })

  it('throws when the update fails', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: { message: 'row-level security violation' } })) }
    const client = { from: vi.fn(() => chain) }
    await expect(updateLead(client as any, 'l-1', { name: 'Ana', phone: '98977777777' })).rejects.toEqual({ message: 'row-level security violation' })
  })
})

describe('updateLeadStage', () => {
  it('updates only the stage column', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await updateLeadStage(client as any, 'l-1', 'vendeu')
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.update).toHaveBeenCalledWith({ stage: 'vendeu' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'l-1')
  })
})

describe('deleteLead', () => {
  it('deletes the lead row', async () => {
    const chain: any = { delete: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await deleteLead(client as any, 'l-1')
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'l-1')
  })

  it('throws when the delete fails', async () => {
    const chain: any = { delete: vi.fn(() => chain), eq: vi.fn(async () => ({ error: { message: 'row-level security violation' } })) }
    const client = { from: vi.fn(() => chain) }
    await expect(deleteLead(client as any, 'l-1')).rejects.toEqual({ message: 'row-level security violation' })
  })
})
