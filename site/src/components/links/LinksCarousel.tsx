'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Testimonial } from '@/lib/types'

const ROTATE_INTERVAL_MS = 5000

export function LinksCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0)
  const current = testimonials[index]

  useEffect(() => {
    if (testimonials.length <= 1) return
    const id = setInterval(() => setIndex((current) => (current + 1) % testimonials.length), ROTATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [testimonials.length])

  return (
    <div className="w-full">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-sm">
        <Image src={current.image_url} alt={current.caption} fill sizes="384px" className="object-cover" />
      </div>

      {testimonials.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {testimonials.map((testimonial, i) => (
            <button
              key={testimonial.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              className="flex h-11 items-center justify-center px-2"
            >
              <span
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-aguiar-red' : 'w-2 bg-support-gray/30'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
