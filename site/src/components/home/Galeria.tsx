'use client'

import { useEffect, useRef, useState } from 'react'

const FALLBACK_PHOTO = '/images/showroom-fachada.jpg'

export function Galeria({ photos = [] }: { photos?: string[] }) {
  const gallery = photos.length > 0 ? photos : [FALLBACK_PHOTO]
  const backgroundPhoto = gallery[0]
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

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
      const rect = wrapper!.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) {
        setProgress(1)
        return
      }
      setProgress(Math.min(1, Math.max(0, -rect.top / scrollable)))
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

  const width = reducedMotion ? 100 : 72 + progress * 28
  const height = reducedMotion ? 100 : 58 + progress * 42
  const radius = reducedMotion ? 0 : 24 * (1 - progress)
  const imgScale = reducedMotion ? 1.1 : 1 + progress * 0.12
  const cardOpacity = reducedMotion ? 0 : Math.max(0, 1 - progress / 0.35)

  return (
    <section
      ref={wrapperRef}
      aria-label="Showroom da Aguiar Veículos"
      className="relative bg-graphite"
      style={{ height: reducedMotion ? '100vh' : '250vh' }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundPhoto}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-graphite/70 via-graphite/40 to-graphite/80" />

        <div className="relative flex h-full w-full items-center justify-center">
          <div
            className="relative overflow-hidden shadow-2xl"
            style={{ width: `${width}vw`, height: `${height}vh`, borderRadius: `${radius}px` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[photoIndex] ?? gallery[0]}
              alt="Showroom da Aguiar Veículos"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: `scale(${imgScale})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite/70 via-graphite/10 to-transparent" />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white"
              style={{ opacity: cardOpacity }}
            >
              <h2 className="max-w-md text-3xl font-bold leading-tight md:text-4xl">
                Entre no showroom e escolha o seu
              </h2>
              <p className="text-sm uppercase tracking-widest text-support-gray">Role para expandir</p>
            </div>
            <div
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
              style={{ opacity: cardOpacity, pointerEvents: cardOpacity > 0.05 ? 'auto' : 'none' }}
            >
              {gallery.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  aria-label={`Ver foto ${index + 1} do showroom`}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === photoIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

