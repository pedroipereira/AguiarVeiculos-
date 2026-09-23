'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { Testimonial } from '@/lib/types'
import { isLightTone, type SectionTone } from '@/components/ui/Section'

// On a computer, four cards fit exactly in the 1156px content width: 4 * 277 + 3 * 16 = 1156.
// On a phone, a card is as wide as the carousel itself (`100cqw`), so one testimonial shows at a time.
// The card width lives in a CSS variable, so the slide step is "one card plus the gap" at any width.
const GAP = 16
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
  const arrowClass = `flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
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
      <div className="overflow-hidden [container-type:inline-size]">
        <div
          data-testid="carousel-track"
          className="flex w-max gap-4 [--card-w:100cqw] sm:[--card-w:277px]"
          style={{
            transform: `translateX(calc((var(--card-w) + ${GAP}px) * -${position}))`,
            transition: jumping || reducedMotion ? 'none' : `transform ${SLIDE_MS}ms ease-out`,
          }}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget) finishSlide()
          }}
        >
          {cards.map((testimonial, index) => {
            const readByScreenReaders = index >= copyLength && index < copyLength + count
            return (
              <div
                key={index}
                data-testid="testimonial-card"
                className={`w-[var(--card-w)] shrink-0 overflow-hidden rounded-2xl border ${
                  light
                    ? 'border-support-gray/10 bg-white text-graphite shadow-sm'
                    : 'border-white/10 bg-white/[0.04] text-white'
                }`}
              >
                {/* The photo fills the card edge to edge, with no frame around it. */}
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={testimonial.image_url}
                    alt={readByScreenReaders ? 'Depoimento de cliente Aguiar Veículos' : ''}
                    aria-hidden={readByScreenReaders ? undefined : true}
                    fill
                    sizes="(min-width: 640px) 277px, 100vw"
                    className="object-cover"
                  />
                </div>
                <p
                  aria-hidden={readByScreenReaders ? undefined : true}
                  className={`p-5 text-sm leading-relaxed ${light ? 'text-graphite/80' : 'text-white/90'}`}
                >
                  {testimonial.caption}
                </p>
              </div>
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
              className="flex h-11 w-6 items-center justify-center"
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
