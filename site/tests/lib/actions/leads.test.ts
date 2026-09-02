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

  it('rejects moving a vehicle-linked lead to "vendeu" when its current stage is not already vendeu', async () => {
    const selectChain: any = {
      select: vi.fn(() => selectChain),
      eq: vi.fn(() => selectChain),
      single: vi.fn(async () => ({ data: { stage: 'negociando' }, error: null })),
    }
    const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))
    const client = { from: vi.fn(() => ({ ...selectChain, update })) }

    await expect(
      updateLead(client as any, 'l-1', { name: 'Maria', phone: '98999999999', vehicleId: 'v-1', stage: 'vendeu' }),
    ).rejects.toThrow('Mova para "Vendeu" pelo quadro de leads, completando a venda do veículo.')
    expect(update).not.toHaveBeenCalled()
  })

  it('allows updating other fields on a lead already at "vendeu" with a vehicle linked', async () => {
    const eqAfterUpdate = vi.fn(async () => ({ error: null }))
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: { stage: 'vendeu' }, error: null })),
      update: vi.fn(() => ({ eq: eqAfterUpdate })),
    }
    const client = { from: vi.fn(() => chain) }

    await updateLead(client as any, 'l-1', { name: 'Maria', phone: '98999999999', vehicleId: 'v-1', stage: 'vendeu' })

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'vendeu', vehicle_id: 'v-1' }),
    )
    expect(eqAfterUpdate).toHaveBeenCalledWith('id', 'l-1')
  })

  it('allows moving a lead with no vehicle linked to "vendeu" without checking the current stage', async () => {
    const select = vi.fn()
    const single = vi.fn()
    const eqAfterUpdate = vi.fn(async () => ({ error: null }))
    const chain: any = { select, single, update: vi.fn(() => ({ eq: eqAfterUpdate })) }
    const client = { from: vi.fn(() => chain) }

    await updateLead(client as any, 'l-1', { name: 'Maria', phone: '98999999999', stage: 'vendeu' })

    expect(select).not.toHaveBeenCalled()
    expect(single).not.toHaveBeenCalled()
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ stage: 'vendeu', vehicle_id: null }))
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
