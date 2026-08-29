import { describe, it, expect, vi } from 'vitest'
import { getVehicleImages, getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'

function makeFakeClient(rows: any[]) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(async () => ({ data: rows, error: null })),
  }
  const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }))
  return {
    from: vi.fn(() => chain),
    storage: { from: vi.fn(() => ({ getPublicUrl })) },
    chain,
    getPublicUrl,
  }
}

describe('getVehicleImages', () => {
  it('returns the images of one vehicle ordered by display_order', async () => {
    const client = makeFakeClient([{ id: 'i1', vehicle_id: 'v1', storage_path: 'a.jpg', display_order: 0 }])
    const result = await getVehicleImages(client as any, 'v1')
    expect(client.from).toHaveBeenCalledWith('vehicle_images')
    expect(client.chain.eq).toHaveBeenCalledWith('vehicle_id', 'v1')
    expect(result).toHaveLength(1)
  })
})

describe('getPrimaryImageUrlsByVehicleIds', () => {
  it('queries once with .in() and keeps only the first image per vehicle', async () => {
    const client = makeFakeClient([
      { id: 'i1', vehicle_id: 'v1', storage_path: 'v1-primeira.jpg', display_order: 0 },
      { id: 'i2', vehicle_id: 'v1', storage_path: 'v1-segunda.jpg', display_order: 1 },
      { id: 'i3', vehicle_id: 'v2', storage_path: 'v2-primeira.jpg', display_order: 0 },
    ])

    const result = await getPrimaryImageUrlsByVehicleIds(client as any, ['v1', 'v2'])

    expect(client.from).toHaveBeenCalledWith('vehicle_images')
    expect(client.chain.in).toHaveBeenCalledWith('vehicle_id', ['v1', 'v2'])
    expect(client.chain.order).toHaveBeenCalledWith('display_order', { ascending: true })
    expect(client.storage.from).toHaveBeenCalledWith('vehicle-images')
    expect(Object.keys(result)).toEqual(['v1', 'v2'])
    expect(result).toEqual({
      v1: 'https://cdn.test/v1-primeira.jpg',
      v2: 'https://cdn.test/v2-primeira.jpg',
    })
  })

  it('leaves vehicles without photos out of the map', async () => {
    const client = makeFakeClient([])
    const result = await getPrimaryImageUrlsByVehicleIds(client as any, ['v1'])
    expect(result).toEqual({})
  })

  it('skips the query entirely when there are no vehicle ids', async () => {
    const client = makeFakeClient([])
    const result = await getPrimaryImageUrlsByVehicleIds(client as any, [])
    expect(result).toEqual({})
    expect(client.from).not.toHaveBeenCalled()
  })
})
