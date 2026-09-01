import { describe, it, expect, vi } from 'vitest'
import { getVehicleExpenses, getVehicleExpenseTotals } from '@/lib/queries/vehicle-expenses'

describe('getVehicleExpenses', () => {
  it('queries vehicle_expenses filtered by vehicle_id, ordered by created_at', async () => {
    const row = { id: 'e-1', vehicle_id: 'v-1', category: 'pintura', description: null, amount_cents: 50000, created_at: '2026-08-01' }
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(async () => ({ data: [row], error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getVehicleExpenses(client as any, 'v-1')
    expect(client.from).toHaveBeenCalledWith('vehicle_expenses')
    expect(chain.eq).toHaveBeenCalledWith('vehicle_id', 'v-1')
    expect(result).toEqual([row])
  })
})

describe('getVehicleExpenseTotals', () => {
  it('sums amount_cents per vehicle across one batched query', async () => {
    const rows = [
      { vehicle_id: 'v-1', amount_cents: 50000 },
      { vehicle_id: 'v-1', amount_cents: 20000 },
      { vehicle_id: 'v-2', amount_cents: 10000 },
    ]
    const chain: any = { select: vi.fn(() => chain), in: vi.fn(async () => ({ data: rows, error: null })) }
    const client = { from: vi.fn(() => chain) }
    const result = await getVehicleExpenseTotals(client as any, ['v-1', 'v-2'])
    expect(chain.in).toHaveBeenCalledWith('vehicle_id', ['v-1', 'v-2'])
    expect(result).toEqual({ 'v-1': 70000, 'v-2': 10000 })
  })

  it('returns an empty object without querying when given no ids', async () => {
    const client = { from: vi.fn() }
    const result = await getVehicleExpenseTotals(client as any, [])
    expect(result).toEqual({})
    expect(client.from).not.toHaveBeenCalled()
  })
})
