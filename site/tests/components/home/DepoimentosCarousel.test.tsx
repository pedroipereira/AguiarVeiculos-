import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import { DepoimentosCarousel } from '@/components/home/DepoimentosCarousel'
import type { Testimonial } from '@/lib/types'

// Same numbers the carousel uses: 277px card + 16px gap. Four cards fit exactly in the
// 1156px content width, so no card is ever cut off at the edge on desktop.
const STEP_PX = 293
const VISIBLE = 4

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

function track() {
  return screen.getByTestId('carousel-track')
}

/** How many cards the track is shifted to the left. */
function offsetInCards() {
  const px = Number(/translateX\((-?[\d.]+)px\)/.exec(track().style.transform)?.[1])
  return Math.abs(px) / STEP_PX
}

/** Clicks an arrow and lets the slide animation finish, like a browser would. */
function step(direction: 'next' | 'prev') {
  fireEvent.click(screen.getByLabelText(direction === 'next' ? /próximo depoimento/i : /depoimento anterior/i))
  fireEvent.transitionEnd(track())
}

/** 1-based number of the highlighted dot. */
function activeDot() {
  const dots = screen.getAllByLabelText(/ir para o depoimento/i)
  return dots.findIndex((dot) => dot.getAttribute('aria-current') === 'true') + 1
}

describe('DepoimentosCarousel', () => {
  it('shows each testimonial exactly once to screen readers', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(4)} />)
    expect(screen.getAllByRole('img')).toHaveLength(4)
  })

  it('has previous and next buttons that are never disabled, and one dot per testimonial', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
    expect(screen.getByLabelText(/depoimento anterior/i)).not.toBeDisabled()
    expect(screen.getByLabelText(/próximo depoimento/i)).not.toBeDisabled()
    expect(screen.getAllByLabelText(/ir para o depoimento/i)).toHaveLength(5)
  })

  it('does not move by itself', () => {
    vi.useFakeTimers()
    try {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      const before = { dot: activeDot(), offset: offsetInCards() }
      act(() => {
        vi.advanceTimersByTime(120_000)
      })
      expect({ dot: activeDot(), offset: offsetInCards() }).toEqual(before)
    } finally {
      vi.useRealTimers()
    }
  })

  it('goes back to the first testimonial after the last one, so it never ends', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
    expect(activeDot()).toBe(1)
    step('next')
    expect(activeDot()).toBe(2)
    for (let i = 0; i < 4; i++) step('next')
    expect(activeDot()).toBe(1)
  })

  it('goes from the first testimonial back to the last one', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
    step('prev')
    expect(activeDot()).toBe(5)
  })

  it.each([1, 2, 3, 4, 5, 6, 7])(
    'never shows an empty space, whichever way you go, with %i testimonials',
    (count) => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(count)} />)
      const totalCards = screen.getAllByTestId('testimonial-card').length
      const assertFull = () => {
        expect(offsetInCards()).toBeGreaterThanOrEqual(0)
        expect(offsetInCards() + VISIBLE).toBeLessThanOrEqual(totalCards)
      }
      assertFull()
      for (let i = 0; i < count * 3 + 2; i++) {
        step('next')
        assertFull()
      }
      for (let i = 0; i < count * 3 + 2; i++) {
        step('prev')
        assertFull()
      }
    },
  )

  it('jumps to a testimonial when its dot is clicked', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
    fireEvent.click(screen.getByLabelText('Ir para o depoimento 4'))
    fireEvent.transitionEnd(track())
    expect(activeDot()).toBe(4)
  })

  it('does not scroll on its own with a CSS animation either', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
    expect(track().className).not.toMatch(/animate-/)
    expect(track().style.animation).toBe('')
  })

  it('on a light background, draws the cards white and the arrows and dots dark', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} tone="light-soft" />)
    expect(screen.getAllByTestId('testimonial-card')[0]).toHaveClass('bg-white')
    for (const arrow of [screen.getByLabelText('Depoimento anterior'), screen.getByLabelText('Próximo depoimento')]) {
      expect(arrow).toHaveClass('border-graphite', 'text-graphite', 'hover:bg-graphite', 'hover:text-white')
      expect(arrow).not.toHaveClass('border-white')
    }
    const idleDot = screen.getByLabelText('Ir para o depoimento 2').firstElementChild
    expect(idleDot).toHaveClass('bg-graphite/25')
  })

  it('keeps the white arrows on a dark background', () => {
    render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
    expect(screen.getByLabelText('Próximo depoimento')).toHaveClass('border-white', 'text-white')
  })
})
