import { describe, it, expect, vi } from 'vitest'
import { getPublishedTestimonials } from '@/lib/queries/testimonials'

describe('getPublishedTestimonials', () => {
  it('queries testimonials_published ordered by display_order', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      order: vi.fn(async () => ({ data: [{ id: '1', caption: 'Ótimo!' }], error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getPublishedTestimonials(client as any)
    expect(client.from).toHaveBeenCalledWith('testimonials_published')
    expect(result).toEqual([{ id: '1', caption: 'Ótimo!' }])
  })
})
