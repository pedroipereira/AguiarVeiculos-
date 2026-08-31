'use client'

import { useState } from 'react'
import type { Testimonial } from '@/lib/types'
import { Card } from '@/components/ui/Card'

const VISIBLE = 3
const CARD_WIDTH = 280
const GAP = 16
const STEP = CARD_WIDTH + GAP

export function DepoimentosCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0)
  const maxIndex = Math.max(0, testimonials.length - VISIBLE)

  function prev() {
    setIndex((current) => (current === 0 ? maxIndex : current - 1))
  }

  function next() {
    setIndex((current) => (current === maxIndex ? 0 : current + 1))
  }

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * STEP}px)` }}
        >
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="w-[280px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={testimonial.image_url}
                alt="Depoimento de cliente Aguiar Veículos"
                className="mb-4 rounded"
              />
              <p>{testimonial.caption}</p>
            </Card>
          ))}
        </div>
      </div>

      {maxIndex > 0 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Depoimento anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-graphite"
          >
            ‹
          </button>
          <div className="flex gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => setIndex(dotIndex)}
                aria-label={`Ir para o depoimento ${dotIndex + 1}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  dotIndex === index ? 'bg-aguiar-red' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label="Próximo depoimento"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-graphite"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
