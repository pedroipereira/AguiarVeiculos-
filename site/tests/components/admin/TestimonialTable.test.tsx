import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminDeleteTestimonial, adminSetTestimonialPublished, adminReorderTestimonials } = vi.hoisted(() => ({
  adminDeleteTestimonial: vi.fn(),
  adminSetTestimonialPublished: vi.fn(),
  adminReorderTestimonials: vi.fn(),
}))
vi.mock('@/app/actions/testimonials', () => ({ adminDeleteTestimonial, adminSetTestimonialPublished, adminReorderTestimonials }))

import { TestimonialTable } from '@/components/admin/TestimonialTable'
import type { Testimonial } from '@/lib/types'

function makeTestimonial(overrides: Partial<Testimonial> = {}): Testimonial {
  return {
    id: 't-1', image_url: 'https://cdn.test/cliente.jpg', caption: 'Ótimo atendimento!',
    display_order: 0, is_published: true, created_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('TestimonialTable', () => {
  beforeEach(() => {
    adminDeleteTestimonial.mockClear()
    adminSetTestimonialPublished.mockClear()
    adminReorderTestimonials.mockClear()
  })

  it('shows an empty state with no testimonials', () => {
    render(<TestimonialTable initialTestimonials={[]} />)
    expect(screen.getByText(/nenhum depoimento/i)).toBeInTheDocument()
  })

  it('shows each testimonial\'s photo and caption', () => {
    render(<TestimonialTable initialTestimonials={[makeTestimonial()]} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/cliente.jpg')
    expect(screen.getByText('Ótimo atendimento!')).toBeInTheDocument()
  })

  it('toggles published state and removes it from the grid optimistically', async () => {
    render(<TestimonialTable initialTestimonials={[makeTestimonial({ is_published: true })]} />)
    fireEvent.click(screen.getByRole('button', { name: /despublicar/i }))
    expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument()
    await waitFor(() => expect(adminSetTestimonialPublished).toHaveBeenCalledWith('t-1', false))
  })

  it('deletes a testimonial after confirming, and removes it from the grid optimistically', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TestimonialTable initialTestimonials={[makeTestimonial()]} />)
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await waitFor(() => expect(adminDeleteTestimonial).toHaveBeenCalledWith('t-1'))
  })

  it('does not delete when the confirmation is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<TestimonialTable initialTestimonials={[makeTestimonial()]} />)
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(adminDeleteTestimonial).not.toHaveBeenCalled()
  })
})
