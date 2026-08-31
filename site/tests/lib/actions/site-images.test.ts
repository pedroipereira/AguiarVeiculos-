import { describe, it, expect, vi } from 'vitest'
import { addSiteImage, deleteSiteImage, replaceSiteImage } from '@/lib/actions/site-images'

function makeClient(count = 0) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: { id: 'img-new' }, error: null })),
    then: (resolve: (value: { count: number; error: null }) => void) => resolve({ count, error: null }),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('addSiteImage', () => {
  it('inserts the image with display_order set to the current count for that slot', async () => {
    const { from, chain } = makeClient(2)
    const result = await addSiteImage({ from } as any, 'hero', 'abc-showroom.jpg')
    expect(from).toHaveBeenCalledWith('site_images')
    expect(chain.eq).toHaveBeenCalledWith('slot', 'hero')
    expect(chain.insert).toHaveBeenCalledWith({ slot: 'hero', storage_path: 'abc-showroom.jpg', display_order: 2 })
    expect(result).toEqual({ id: 'img-new' })
  })

  it('starts display_order at 0 for the first image in a slot', async () => {
    const { chain } = makeClient(0)
    await addSiteImage({ from: () => chain } as any, 'galeria', 'first.jpg')
    expect(chain.insert).toHaveBeenCalledWith({ slot: 'galeria', storage_path: 'first.jpg', display_order: 0 })
  })
})

describe('deleteSiteImage', () => {
  it('deletes the image by id', async () => {
    const { from, chain } = makeClient()
    chain.eq.mockImplementationOnce(async () => ({ error: null }))
    await deleteSiteImage({ from } as any, 'img-1')
    expect(from).toHaveBeenCalledWith('site_images')
    expect(chain.delete).toHaveBeenCalled()
  })
})

describe('replaceSiteImage', () => {
  it('deletes whatever was in the slot, then inserts the new image at display_order 0', async () => {
    const { from, chain } = makeClient()
    chain.eq.mockImplementationOnce(async () => ({ error: null }))
    const result = await replaceSiteImage({ from } as any, 'hero', 'new-hero.jpg')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('slot', 'hero')
    expect(chain.insert).toHaveBeenCalledWith({ slot: 'hero', storage_path: 'new-hero.jpg', display_order: 0 })
    expect(result).toEqual({ id: 'img-new' })
  })
})
