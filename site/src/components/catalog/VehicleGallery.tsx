'use client'

import { useEffect, useRef, useState } from 'react'
import { useSwipe } from '@/lib/use-swipe'
import { VehicleLightbox } from './VehicleLightbox'

const roundButton =
  'flex h-11 w-11 items-center justify-center rounded-full bg-graphite/60 text-white backdrop-blur transition-colors hover:bg-graphite/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function VehicleGallery({ images, label }: { images: string[]; label: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const count = images.length
  const goTo = (index: number) => setActiveIndex(count > 0 ? ((index % count) + count) % count : 0)
  const swipe = useSwipe(() => goTo(activeIndex + 1), () => goTo(activeIndex - 1))

  // Warms up the photos on each side of the current one, so paging feels instant.
  useEffect(() => {
    if (count < 2) return
    for (const index of [activeIndex + 1, activeIndex - 1]) {
      const preload = new Image()
      preload.src = images[(index + count) % count]
    }
  }, [activeIndex, images, count])

  // Keeps the current thumbnail in the middle of the strip. Only the strip moves, never the page.
  useEffect(() => {
    const strip = stripRef.current
    const thumb = strip?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!strip || !thumb) return
    strip.scrollTo?.({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: 'smooth' })
  }, [activeIndex])

  if (count === 0) {
    return (
      <div
        role="presentation"
        data-testid="vehicle-gallery-placeholder"
        className="aspect-[4/3] w-full max-w-lg rounded-lg bg-white/10"
      />
    )
  }

  function openViewer(from: HTMLElement | null) {
    opener.current = from
    setViewerOpen(true)
  }

  function closeViewer() {
    setViewerOpen(false)
    opener.current?.focus()
    opener.current = null
  }

  return (
    <div>
      {/* Edge to edge and tall on a phone, so photos taken standing up fill it; 4:3 inside the page from the small
          breakpoint up. The empty sides of a photo are filled with a blurred copy of it, and the photo itself is
          always shown whole, never stretched or cropped. */}
      <div
        data-testid="vehicle-gallery-frame"
        {...(count > 1 ? swipe : {})}
        className="relative -mx-6 aspect-[4/5] overflow-hidden bg-graphite sm:mx-0 sm:aspect-[4/3] sm:rounded-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-testid="vehicle-gallery-backdrop"
          src={images[activeIndex]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
        />
        <div className="absolute inset-0 bg-graphite/30" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={label}
          draggable={false}
          onClick={() => openViewer(null)}
          className="relative h-full w-full cursor-zoom-in object-contain"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Foto anterior"
              className={`absolute left-3 top-1/2 hidden -translate-y-1/2 sm:flex ${roundButton}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19 8 12l7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Próxima foto"
              className={`absolute right-3 top-1/2 hidden -translate-y-1/2 sm:flex ${roundButton}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </button>
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-graphite/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {activeIndex + 1} / {count}
            </span>
          </>
        )}

        <button
          type="button"
          onClick={(event) => openViewer(event.currentTarget)}
          aria-label="Ver em tela cheia"
          className={`absolute bottom-3 right-3 ${roundButton}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          </svg>
        </button>
      </div>

      {count > 1 && (
        <div
          ref={stripRef}
          data-testid="vehicle-gallery-strip"
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((url, index) => {
            const current = index === activeIndex
            return (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver foto ${index + 1} de ${label}`}
                aria-current={current ? 'true' : undefined}
                className={`relative h-[60px] w-20 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-[66px] sm:w-[88px] ${
                  current ? 'border-aguiar-red' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            )
          })}
        </div>
      )}

      {viewerOpen && (
        <VehicleLightbox images={images} label={label} index={activeIndex} onIndexChange={goTo} onClose={closeViewer} />
      )}
    </div>
  )
}
