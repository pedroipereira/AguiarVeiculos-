import { render, screen, fireEvent, act } from '@testing-library/react'
import { LinksCarousel } from '@/components/links/LinksCarousel'
import type { Testimonial } from '@/lib/types'

function makeTestimonials(count: number): Testimonial[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    image_url: `https://x/${i + 1}.jpg`,
    caption: `Depoimento ${i + 1}`,
    display_order: i,
    is_published: true,
    created_at: '2026-01-01',
  }))
}

describe('LinksCarousel', () => {
  it('shows the first photo and no dots when there is only one', () => {
    render(<LinksCarousel testimonials={makeTestimonials(1)} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/1.jpg')
    expect(screen.queryByLabelText(/ver foto/i)).not.toBeInTheDocument()
  })

  it('switches photos when a dot is clicked', () => {
    render(<LinksCarousel testimonials={makeTestimonials(3)} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/1.jpg')

    fireEvent.click(screen.getByLabelText('Ver foto 2'))
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/2.jpg')
  })

  it('auto-advances to the next photo, looping back to the first after the last', () => {
    vi.useFakeTimers()
    render(<LinksCarousel testimonials={makeTestimonials(3)} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/1.jpg')

    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/2.jpg')

    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/3.jpg')

    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/1.jpg')
    vi.useRealTimers()
  })

  it('never auto-advances when there is only one photo', () => {
    vi.useFakeTimers()
    render(<LinksCarousel testimonials={makeTestimonials(1)} />)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/1.jpg')
    vi.useRealTimers()
  })
})
