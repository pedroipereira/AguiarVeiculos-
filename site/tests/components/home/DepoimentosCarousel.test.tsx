import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import { DepoimentosCarousel } from '@/components/home/DepoimentosCarousel'
import type { Testimonial } from '@/lib/types'

// On a computer, four 277px cards plus 16px gaps fill the 1156px content width exactly. On a phone,
// the card width is the whole width of the carousel, so only one testimonial shows at a time.
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

/** How many cards the track is shifted to the left. The step is one card plus the 16px gap, whatever its width. */
function offsetInCards() {
  const match = /translateX\(calc\(\(var\(--card-w\) \+ 16px\) \* (-?[\d.]+)\)\)/.exec(track().style.transform)
  return Math.abs(Number(match?.[1]))
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

  describe('the card around each photo', () => {
    it('on the black page, is a dark panel with a thin border, not a bright frame', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      const card = screen.getAllByTestId('testimonial-card')[0]
      expect(card).toHaveClass('overflow-hidden', 'rounded-2xl', 'border', 'border-white/10', 'bg-white/[0.04]', 'text-white')
      expect(card).not.toHaveClass('bg-card-gray')
      expect(card.className).not.toMatch(/(^|\s)p-\d/)
    })

    it('lets the photo fill the card edge to edge, with no frame around it', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      const photo = screen.getAllByAltText('Depoimento de cliente Aguiar Veículos')[0]
      expect(photo).toHaveClass('aspect-[3/4]', 'w-full', 'object-cover')
      expect(photo.className).not.toMatch(/(^|\s)(mb-\d|m-\d|rounded)/)
    })

    it('puts the caption below the photo, in light text at the smaller size, with its own padding', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      const caption = screen.getAllByText('Depoimento 1')[0]
      expect(caption).toHaveClass('p-5', 'text-sm', 'text-white/90')
      expect(caption).not.toHaveClass('text-base')
    })

    it('keeps every card the same height, so the row looks even', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      expect(track()).toHaveClass('flex')
      expect(track().className).not.toMatch(/items-(start|center|end)/)
    })

    it('on a light background, is a white card with dark text and the same edge-to-edge photo', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} tone="light-soft" />)
      const card = screen.getAllByTestId('testimonial-card')[0]
      expect(card).toHaveClass('overflow-hidden', 'rounded-2xl', 'bg-white', 'text-graphite')
      expect(screen.getAllByText('Depoimento 1')[0]).toHaveClass('p-5', 'text-graphite/80')
    })
  })

  describe('on a phone', () => {
    it('measures its width from its own box, so a card can be as wide as the carousel', () => {
      const { container } = render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      expect(container.querySelector('.overflow-hidden')).toHaveClass('[container-type:inline-size]')
    })

    it('makes each card as wide as the carousel, so only one shows at a time, and 277px from the small-tablet size up', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      expect(track()).toHaveClass('[--card-w:100cqw]', 'sm:[--card-w:277px]')
      for (const card of screen.getAllByTestId('testimonial-card')) expect(card).toHaveClass('w-[var(--card-w)]')
      expect(screen.getAllByTestId('testimonial-card')[0]).not.toHaveClass('w-[277px]')
    })

    it('moves by one whole card per arrow, however wide the card is', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      const start = offsetInCards()
      expect(Number.isFinite(start)).toBe(true)
      fireEvent.click(screen.getByLabelText(/próximo depoimento/i))
      expect(offsetInCards()).toBe(start + 1)
    })
  })

  describe('touch sizes', () => {
    it('makes the arrows 44px, and the dots as tall as a finger', () => {
      render(<DepoimentosCarousel testimonials={makeTestimonials(5)} />)
      for (const arrow of [screen.getByLabelText('Depoimento anterior'), screen.getByLabelText('Próximo depoimento')]) {
        expect(arrow).toHaveClass('h-11', 'w-11')
      }
      for (const dot of screen.getAllByLabelText(/ir para o depoimento/i)) expect(dot).toHaveClass('h-11', 'w-6')
    })
  })
})
