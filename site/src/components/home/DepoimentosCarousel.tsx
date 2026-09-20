'use client'

import { useEffect, useRef, useState } from 'react'
import type { Testimonial } from '@/lib/types'
import { isLightTone, type SectionTone } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'

// Four cards fit exactly in the 1156px content width: 4 * 277 + 3 * 16 = 1156.
const CARD_WIDTH = 277
const GAP = 16
const STEP = CARD_WIDTH + GAP
const VISIBLE = 4
const SLIDE_MS = 500
// Safety net in case the browser never reports the end of the slide (e.g. hidden tab).
const SLIDE_FALLBACK_MS = SLIDE_MS + 200

/**
 * Infinite carousel driven by the arrows: it never reaches an end and never shows an
 * empty space. The testimonials are repeated three times; the view rests on the middle
 * copy and, after each slide, silently jumps back to it (the copies look identical).
 */
export function DepoimentosCarousel({
  testimonials,
  tone = 'dark',
}: {
  testimonials: Testimonial[]
  tone?: SectionTone
}) {
  const light = isLightTone(tone)
  const arrowClass = `flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
    light
      ? 'border-graphite text-graphite hover:bg-graphite hover:text-white'
      : 'border-white text-white hover:bg-white hover:text-graphite'
  }`
  const count = testimonials.length
  // One copy must be longer than the cards on screen, and a multiple of `count`
  // so every copy looks the same and the jump back is invisible.
  const copyLength = count * Math.ceil((VISIBLE + 1) / count)
  const copy = Array.from({ length: copyLength }, (_, index) => testimonials[index % count])
  const cards = [...copy, ...copy, ...copy]

  const [position, setPosition] = useState(copyLength)
  const [jumping, setJumping] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const sliding = useRef(false)
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return () => clearTimeout(fallbackTimer.current)
  }, [])

  /** Brings any position back to the middle copy. */
  function toMiddleCopy(value: number) {
    return ((((value - copyLength) % copyLength) + copyLength) % copyLength) + copyLength
  }

  function finishSlide() {
    clearTimeout(fallbackTimer.current)
    sliding.current = false
    setJumping(true)
    setPosition(toMiddleCopy)
  }

  function slideTo(target: (current: number) => number) {
    if (sliding.current) return
    sliding.current = true
    setJumping(false)
    setPosition(target)
    if (reducedMotion) {
      finishSlide()
    } else {
      fallbackTimer.current = setTimeout(finishSlide, SLIDE_FALLBACK_MS)
    }
  }

  const activeIndex = position % count

  return (
    <div>
      <div className="overflow-hidden">
        <div
          data-testid="carousel-track"
          className="flex w-max gap-4"
          style={{
            transform: `translateX(-${position * STEP}px)`,
            transition: jumping || reducedMotion ? 'none' : `transform ${SLIDE_MS}ms ease-out`,
          }}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget) finishSlide()
          }}
        >
          {cards.map((testimonial, index) => {
            const readByScreenReaders = index >= copyLength && index < copyLength + count
            return (
              <Card key={index} data-testid="testimonial-card" surface={light ? 'white' : 'gray'} className="w-[277px] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={testimonial.image_url}
                  alt={readByScreenReaders ? 'Depoimento de cliente Aguiar Veículos' : ''}
                  aria-hidden={readByScreenReaders ? undefined : true}
                  className="mb-4 aspect-[3/4] w-full rounded object-cover"
                />
                <p aria-hidden={readByScreenReaders ? undefined : true}>{testimonial.caption}</p>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => slideTo((current) => current - 1)}
          aria-label="Depoimento anterior"
          className={arrowClass}
        >
          ‹
        </button>
        <div className="flex">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.id}
              type="button"
              onClick={() => slideTo(() => copyLength + index)}
              aria-label={`Ir para o depoimento ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === activeIndex ? 'bg-aguiar-red' : light ? 'bg-graphite/25' : 'bg-white/30'
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => slideTo((current) => current + 1)}
          aria-label="Próximo depoimento"
          className={arrowClass}
        >
          ›
        </button>
      </div>
    </div>
  )
}
