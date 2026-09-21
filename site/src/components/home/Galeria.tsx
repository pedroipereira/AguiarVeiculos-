'use client'

import { useEffect, useRef, useState } from 'react'
import { focalOffset, parseFocalX } from '@/lib/focal-point'

const FALLBACK_PHOTO = '/images/fotos/showroom-fachada.jpg'

// The section is 2.6 screens tall and pinned: the card grows while the visitor scrolls the extra 1.6.
const SECTION_HEIGHT_VH = 260
const CARD_WIDTH = 300
const CARD_HEIGHT = 400
const CARD_RADIUS = 18
// The photos are 16:9. On a screen taller than wide, filling it would zoom them almost 4x (a 390 x 844 phone),
// so the card stops at the screen width and keeps this shape, and the background becomes a blurred copy.
const STANDING_CARD_RATIO = 4 / 3
const STANDING_BACKGROUND_BLUR = 28
// Each title line slides out by this many screen widths, so it is off the screen when the card is full.
const TITLE_SLIDE = 1.4
const PHOTO_MS = 4000
// The hint disappears as soon as the visitor starts scrolling.
const HINT_UNTIL = 0.05
// The top edge blends into the section above until this point of the scroll; the bottom edge blends
// into the section below over the last part of it.
const FADE_TOP_UNTIL = 0.12
const FADE_BOTTOM_FROM = 0.85

const clamp = (value: number) => Math.min(1, Math.max(0, value))

// Centers the photo on the subject written in its file name (`...-x63.jpg`), whatever the size of the box.
const focalStyle = (photo: string) => {
  const x = focalOffset(parseFocalX(photo))
  return x ? { objectPosition: `${x} 50%` } : undefined
}

export function Galeria({ photos = [] }: { photos?: string[] }) {
  const gallery = photos.length > 0 ? photos : [FALLBACK_PHOTO]
  const wrapperRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [viewport, setViewport] = useState({ width: 1440, height: 900 })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const wrapper = wrapperRef.current
    if (!wrapper) return

    let ticking = false

    function measure() {
      ticking = false
      setViewport({ width: window.innerWidth, height: window.innerHeight })
      const rect = wrapper!.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      setProgress(scrollable <= 0 ? 1 : clamp(-rect.top / scrollable))
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(measure)
      }
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reducedMotion])

  // Changes photo by itself; picking a photo restarts the wait so the visitor gets the full time.
  useEffect(() => {
    if (reducedMotion || gallery.length < 2) return
    const timer = setTimeout(() => setPhotoIndex((current) => (current + 1) % gallery.length), PHOTO_MS)
    return () => clearTimeout(timer)
  }, [photoIndex, reducedMotion, gallery.length])

  // On small screens the starting card is narrower and shorter, so it never overflows.
  // Without animation the visitor gets the full-screen photo right away, in a section one screen tall.
  const shown = reducedMotion ? 1 : progress
  const standing = viewport.width < viewport.height
  const startWidth = Math.min(CARD_WIDTH, viewport.width * 0.78)
  const startHeight = standing ? startWidth / STANDING_CARD_RATIO : Math.min(CARD_HEIGHT, viewport.height * 0.55)
  const endHeight = standing ? viewport.width / STANDING_CARD_RATIO : viewport.height
  const width = startWidth + shown * (viewport.width - startWidth)
  const height = startHeight + shown * (endHeight - startHeight)
  const radius = CARD_RADIUS * (1 - shown)
  const slide = shown * TITLE_SLIDE * viewport.width
  // Both edges of the photo blend into the page gray. Without animation the photo stays still, so both stay on.
  const fadeTop = reducedMotion ? 1 : clamp(1 - shown / FADE_TOP_UNTIL)
  const fadeBottom = reducedMotion ? 1 : clamp((shown - FADE_BOTTOM_FROM) / (1 - FADE_BOTTOM_FROM))

  return (
    <section
      ref={wrapperRef}
      aria-label="Showroom da Aguiar Veículos"
      className="relative bg-graphite"
      style={{ height: reducedMotion ? '100vh' : `${SECTION_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <div data-testid="showroom-background" className="absolute inset-0 [container-type:size]" style={{ opacity: standing ? 1 : 1 - shown }}>
          {/* Same photo as the card, changing with it at the same time. */}
          {gallery.map((photo, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${photo}-${index}`}
              src={photo}
              alt=""
              aria-hidden="true"
              style={
                standing
                  ? { ...focalStyle(photo), filter: `blur(${STANDING_BACKGROUND_BLUR}px)`, transform: 'scale(1.2)' }
                  : focalStyle(photo)
              }
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ${
                index === photoIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className={`absolute inset-0 ${standing ? 'bg-graphite/60' : 'bg-graphite/50'}`} />
        </div>

        <div
          data-testid="showroom-card"
          className="relative z-20 shrink-0 overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] [container-type:size]"
          style={{ width: `${width}px`, height: `${height}px`, borderRadius: `${radius}px` }}
        >
          {gallery.map((photo, index) => {
            const current = index === photoIndex
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${photo}-${index}`}
                src={photo}
                alt={current ? 'Showroom da Aguiar Veículos' : ''}
                aria-hidden={current ? undefined : true}
                style={focalStyle(photo)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ${
                  current ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )
          })}
          {gallery.length > 1 && (
            <div className="absolute bottom-3.5 right-3.5 z-10 flex gap-[7px]">
              {gallery.map((photo, index) => {
                const current = index === photoIndex
                return (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => setPhotoIndex(index)}
                    aria-label={`Ver foto ${index + 1} do showroom`}
                    aria-current={current ? 'true' : undefined}
                    className={`relative h-2 rounded-full transition-all duration-300 before:absolute before:-inset-2 before:content-[''] ${
                      current ? 'w-[22px] bg-white' : 'w-2 bg-white/50'
                    }`}
                  />
                )
              })}
            </div>
          )}
        </div>

        <h2
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 whitespace-nowrap"
        >
          {[
            { id: 'a', text: 'Entre no showroom', offset: -slide },
            { id: 'b', text: 'e escolha o seu.', offset: slide },
          ].map((line) => (
            <span
              key={line.id}
              data-testid={`showroom-title-${line.id}`}
              className="block text-[clamp(1.7rem,6vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.5)] md:text-[clamp(2.2rem,4.4vw,5rem)]"
              style={{ transform: `translateX(${line.offset}px)` }}
            >
              {line.text}{' '}
            </span>
          ))}
        </h2>

        <div
          data-testid="showroom-fade-top"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[45] h-28 bg-gradient-to-b from-graphite to-transparent"
          style={{ opacity: fadeTop }}
        />
        <div
          data-testid="showroom-fade-bottom"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[45] h-28 bg-gradient-to-t from-graphite to-transparent"
          style={{ opacity: fadeBottom }}
        />

        {!reducedMotion && (
          <div
            className="absolute bottom-[30px] left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2.5 text-[0.76rem] uppercase tracking-[0.1em] transition-opacity duration-500"
            style={{ opacity: shown < HINT_UNTIL ? 1 : 0 }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-white/40 motion-safe:animate-hint-bounce">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-white/90" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0-6-6m6 6 6-6" />
              </svg>
            </span>
            <span className="text-white/90">Role para expandir</span>
          </div>
        )}
      </div>
    </section>
  )
}
