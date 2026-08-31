'use client'

import { useRef, useState } from 'react'

export function VehicleGallery({ images, label }: { images: string[]; label: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const viewerRef = useRef<HTMLDivElement>(null)

  if (images.length === 0) {
    return (
      <div
        role="presentation"
        data-testid="vehicle-gallery-placeholder"
        className="aspect-[4/3] w-full max-w-lg rounded-lg bg-support-gray/20"
      />
    )
  }

  function goTo(index: number) {
    setActiveIndex((index + images.length) % images.length)
  }

  function toggleFullscreen() {
    if (viewerRef.current?.requestFullscreen) viewerRef.current.requestFullscreen().catch(() => {})
  }

  return (
    <div>
      <div ref={viewerRef} className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-graphite">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[activeIndex]} alt={label} className="h-full w-full object-contain" />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-graphite/60 text-white transition-colors hover:bg-graphite/80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19 8 12l7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-graphite/60 text-white transition-colors hover:bg-graphite/80"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-graphite/60 px-3 py-1 text-xs font-bold text-white">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Ver em tela cheia"
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-graphite/60 text-white transition-colors hover:bg-graphite/80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          </svg>
        </button>
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ver foto ${index + 1} de ${label}`}
              className={`aspect-[4/3] overflow-hidden rounded-md border-2 transition-colors ${
                index === activeIndex ? 'border-aguiar-red' : 'border-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
