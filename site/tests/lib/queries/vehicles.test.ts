import { describe, it, expect, vi } from 'vitest'
import { getFeaturedVehicles, getAvailableVehicles, getVehicleBySlug } from '@/lib/queries/vehicles'

function makeFakeClient(rows: any[]) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(async () => ({ data: rows, error: null })),
    maybeSingle: vi.fn(async () => ({ data: rows[0] ?? null, error: null })),
    then: (resolve: any) => resolve({ data: rows, error: null }),
  }
  return { from: vi.fn(() => chain) }
}

describe('getFeaturedVehicles', () => {
  it('queries vehicles_public filtered by is_featured', async () => {
    const client = makeFakeClient([{ id: '1', slug: 'a', is_featured: true }])
    const result = await getFeaturedVehicles(client as any, 6)
    expect(client.from).toHaveBeenCalledWith('vehicles_public')
    expect(result).toEqual([{ id: '1', slug: 'a', is_featured: true }])
  })
})

describe('getAvailableVehicles', () => {
  it('returns available vehicles applying brand filter', async () => {
    const client = makeFakeClient([{ id: '2', slug: 'b', brand: 'Fiat' }])
    const result = await getAvailableVehicles(client as any, { brand: 'Fiat' })
    expect(result).toEqual([{ id: '2', slug: 'b', brand: 'Fiat' }])
  })
})

describe('getVehicleBySlug', () => {
  it('returns null when no vehicle matches', async () => {
    const client = makeFakeClient([])
    const result = await getVehicleBySlug(client as any, 'nao-existe')
    expect(result).toBeNull()
  })

  it('returns the vehicle when found', async () => {
    const client = makeFakeClient([{ id: '3', slug: 'vw-polo-2026' }])
    const result = await getVehicleBySlug(client as any, 'vw-polo-2026')
    expect(result).toEqual({ id: '3', slug: 'vw-polo-2026' })
  })
})
