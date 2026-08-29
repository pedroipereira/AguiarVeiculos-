import { describe, it, expect, vi } from 'vitest'
import { saveTestimonial, deleteTestimonial, setTestimonialPublished } from '@/lib/actions/testimonials'

function makeClient() {
  const chain: any = {
    insert: vi.fn(() => chain), update: vi.fn(() => chain), delete: vi.fn(() => chain),
    select: vi.fn(() => chain), eq: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: { id: 't-1' }, error: null })),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('saveTestimonial', () => {
  it('inserts a new testimonial when no id is given', async () => {
    const { from, chain } = makeClient()
    const result = await saveTestimonial({ from } as any, { imageUrl: 'https://x/1.jpg', caption: 'Ótimo!', displayOrder: 1 })
    expect(from).toHaveBeenCalledWith('testimonials')
    expect(chain.insert).toHaveBeenCalled()
    expect(result).toEqual({ id: 't-1' })
  })

  it('updates an existing testimonial by id', async () => {
    const { from, chain } = makeClient()
    await saveTestimonial({ from } as any, { id: 't-1', imageUrl: 'https://x/1.jpg', caption: 'Ótimo!', displayOrder: 1 })
    expect(chain.update).toHaveBeenCalled()
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
