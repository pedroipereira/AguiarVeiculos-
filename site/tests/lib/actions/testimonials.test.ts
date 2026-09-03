import { describe, it, expect, vi } from 'vitest'
import { saveTestimonial, deleteTestimonial, setTestimonialPublished, reorderTestimonials } from '@/lib/actions/testimonials'

function makeClient(count = 0) {
  const chain: any = {
    insert: vi.fn(() => chain), update: vi.fn(() => chain), delete: vi.fn(() => chain),
    select: vi.fn(() => chain), eq: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: { id: 't-1' }, error: null })),
    then: (resolve: (value: { count: number; error: null }) => void) => resolve({ count, error: null }),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('saveTestimonial', () => {
  it('inserts a new testimonial with display_order set to the current count', async () => {
    const { from, chain } = makeClient(3)
    const result = await saveTestimonial({ from } as any, { imageUrl: 'https://x/1.jpg', caption: 'Ótimo!' })
    expect(from).toHaveBeenCalledWith('testimonials')
    expect(chain.insert).toHaveBeenCalledWith({ image_url: 'https://x/1.jpg', caption: 'Ótimo!', display_order: 3 })
    expect(result).toEqual({ id: 't-1' })
  })

  it('starts display_order at 0 for the first testimonial', async () => {
    const { chain } = makeClient(0)
    await saveTestimonial({ from: () => chain } as any, { imageUrl: 'https://x/1.jpg', caption: 'Ótimo!' })
    expect(chain.insert).toHaveBeenCalledWith({ image_url: 'https://x/1.jpg', caption: 'Ótimo!', display_order: 0 })
  })

  it('updates an existing testimonial by id, without touching display_order', async () => {
    const { from, chain } = makeClient()
    chain.eq.mockImplementationOnce(async () => ({ error: null }))
    await saveTestimonial({ from } as any, { id: 't-1', imageUrl: 'https://x/1.jpg', caption: 'Ótimo!' })
    expect(chain.update).toHaveBeenCalledWith({ image_url: 'https://x/1.jpg', caption: 'Ótimo!' })
    expect(chain.eq).toHaveBeenCalledWith('id', 't-1')
  })
})

describe('deleteTestimonial / setTestimonialPublished', () => {
  it('deletes by id', async () => {
    const { from, chain } = makeClient()
    await deleteTestimonial({ from } as any, 't-1')
    expect(chain.delete).toHaveBeenCalled()
  })

  it('toggles is_published', async () => {
    const { from, chain } = makeClient()
    await setTestimonialPublished({ from } as any, 't-1', false)
    expect(chain.update).toHaveBeenCalledWith({ is_published: false })
  })
})

describe('reorderTestimonials', () => {
  it('writes display_order as each id\'s index in the given order', async () => {
    const updateCalls: { payload: unknown; id: string }[] = []
    const client = {
      from: vi.fn(() => ({
        update: (payload: unknown) => ({
          eq: async (_column: string, id: string) => {
            updateCalls.push({ payload, id })
            return { error: null }
          },
        }),
      })),
    }
    await reorderTestimonials(client as any, ['t-2', 't-1'])
    expect(client.from).toHaveBeenCalledWith('testimonials')
    expect(updateCalls).toEqual([
      { payload: { display_order: 0 }, id: 't-2' },
      { payload: { display_order: 1 }, id: 't-1' },
    ])
  })

  it('throws if any update fails', async () => {
    const client = {
      from: vi.fn(() => ({
        update: () => ({ eq: async () => ({ error: { message: 'boom' } }) }),
      })),
    }
    await expect(reorderTestimonials(client as any, ['t-1'])).rejects.toEqual({ message: 'boom' })
  })
})
