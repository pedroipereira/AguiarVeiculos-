import { render, screen, fireEvent } from '@testing-library/react'
import { DepoimentosCarousel } from '@/components/home/DepoimentosCarousel'
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

describe('DepoimentosCarousel', () => {
  it('hides navigation when three or fewer testimonials fit in one view', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(3)} />)
    expect(screen.queryByLabelText(/próximo depoimento/i)).not.toBeInTheDocument()
  })

  it('loops back to the first slide after the last, and vice versa', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)

    const prevButton = screen.getByLabelText(/depoimento anterior/i)
    const nextButton = screen.getByLabelText(/próximo depoimento/i)
    expect(prevButton).not.toBeDisabled()
    expect(nextButton).not.toBeDisabled()

    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    // At the last slide (maxIndex = 5 - 3 = 2), one more click wraps to the first.
    fireEvent.click(nextButton)
    expect(screen.getByLabelText(/ir para o depoimento 1/i)).toHaveClass('bg-aguiar-red')

    // From the first slide, going back wraps to the last.
    fireEvent.click(prevButton)
    expect(screen.getByLabelText(/ir para o depoimento 3/i)).toHaveClass('bg-aguiar-red')
  })
})
