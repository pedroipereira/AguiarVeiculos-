import { describe, it, expect, vi } from 'vitest'
import { getSiteImages, getSiteImageUrls } from '@/lib/queries/site-images'

function makeFakeClient(rows: any[]) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(async () => ({ data: rows, error: null })),
  }
  const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }))
  return {
    from: vi.fn(() => chain),
    storage: { from: vi.fn(() => ({ getPublicUrl })) },
    chain,
  }
}

describe('getSiteImages', () => {
  it('returns the images of one slot ordered by display_order', async () => {
    const rows = [{ id: 'i1', slot: 'hero', storage_path: 'a.jpg', display_order: 0, created_at: '' }]
    const client = makeFakeClient(rows)
    const result = await getSiteImages(client as any, 'hero')
    expect(client.from).toHaveBeenCalledWith('site_images')
    expect(client.chain.eq).toHaveBeenCalledWith('slot', 'hero')
    expect(result).toEqual(rows)
  })
})

describe('getSiteImageUrls', () => {
  it('converts each row to a public site-images URL', async () => {
    const rows = [
      { id: 'i1', slot: 'galeria', storage_path: 'a.jpg', display_order: 0, created_at: '' },
      { id: 'i2', slot: 'galeria', storage_path: 'b.jpg', display_order: 1, created_at: '' },
    ]
    const client = makeFakeClient(rows)
    const result = await getSiteImageUrls(client as any, 'galeria')
    expect(client.storage.from).toHaveBeenCalledWith('site-images')
    expect(result).toEqual(['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg'])
  })

  it('returns an empty array when the slot has no images', async () => {
    const client = makeFakeClient([])
    const result = await getSiteImageUrls(client as any, 'sobre')
    expect(result).toEqual([])
  })
})
