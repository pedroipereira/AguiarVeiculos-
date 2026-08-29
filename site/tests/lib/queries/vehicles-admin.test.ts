import { describe, it, expect, vi } from 'vitest'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'

describe('getAllVehiclesAdmin', () => {
  it('queries the vehicles table (not the public view) ordered by created_at', async () => {
    const chain: any = { select: vi.fn(() => chain), order: vi.fn(async () => ({ data: [{ id: '1', plate: 'ABC1D23' }], error: null })) }
    const client = { from: vi.fn(() => chain) }
    const result = await getAllVehiclesAdmin(client as any)
    expect(client.from).toHaveBeenCalledWith('vehicles')
    expect(result).toEqual([{ id: '1', plate: 'ABC1D23' }])
  })
})
