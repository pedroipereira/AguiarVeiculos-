'use client'

import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { useSwipe } from '@/lib/use-swipe'

interface VehicleLightboxProps {
  images: string[]
  label: string
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

// How much bigger than the fitted photo it gets when zoomed. The photo is then moved around by scrolling.
const ZOOM = 2.5

const roundButton =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/**
 * The photos of a vehicle over the whole screen. The browser's own full-screen mode does not work on an
 * iPhone for a photo, so this is a plain layer: the photo is shown whole, as big as the screen allows.
 * A tap zooms in to see details (the rest of the site keeps two-finger zoom blocked), and the photo is then
 * moved around by dragging.
 */
export function VehicleLightbox({ images, label, index, onIndexChange, onClose }: VehicleLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [zoomed, setZoomed] = useState(false)
  // Where the tap was, as a share of the screen: the zoom opens on that spot.
  const [zoomPoint, setZoomPoint] = useState({ x: 0.5, y: 0.5 })
  const count = images.length
  const go = (target: number) => onIndexChange((target + count) % count)
  const swipe = useSwipe(() => go(index + 1), () => go(index - 1))

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Showing another photo starts it at the normal size.
  useEffect(() => {
    setZoomed(false)
  }, [index])

  // Zooming in opens on the spot that was tapped.
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!zoomed || !stage) return
    stage.scrollLeft = zoomPoint.x * stage.scrollWidth - stage.clientWidth / 2
    stage.scrollTop = zoomPoint.y * stage.scrollHeight - stage.clientHeight / 2
  }, [zoomed, zoomPoint])

  function toggleZoom(event?: MouseEvent<HTMLElement>) {
    if (event && !zoomed) {
      const box = event.currentTarget.getBoundingClientRect()
      setZoomPoint({ x: (event.clientX - box.left) / (box.width || 1), y: (event.clientY - box.top) / (box.height || 1) })
    }
    setZoomed((current) => !current)
  }

  useEffect(() => {
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = before
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      } else if (count > 1 && event.key === 'ArrowRight') {
        go(index + 1)
      } else if (count > 1 && event.key === 'ArrowLeft') {
        go(index - 1)
      } else if (event.key === 'Tab') {
        // Keeps the Tab key inside the layer while it is open.
        const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button') ?? [])
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (!first || !last) return
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${label}`}
      className="fixed inset-0 z-[100] flex flex-col bg-graphite pt-[env(safe-area-inset-top)] text-white"
    >
      <div className="flex items-center justify-between px-4 py-3">
        {count > 1 ? <span className="text-sm font-bold">{index + 1} / {count}</span> : <span />}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleZoom()}
            aria-pressed={zoomed}
            aria-label={zoomed ? 'Voltar ao tamanho normal' : 'Ampliar foto'}
            className={roundButton}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m21 21-4.3-4.3M8 11h6" />
              {!zoomed && <path strokeLinecap="round" d="M11 8v6" />}
            </svg>
          </button>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar fotos" className={roundButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
        <div
          ref={stageRef}
          data-testid="vehicle-viewer-stage"
          {...(zoomed ? {} : swipe)}
          className={`absolute inset-x-0 top-0 bottom-[env(safe-area-inset-bottom)] ${zoomed ? 'overflow-auto' : 'overflow-hidden'}`}
        >
          <div
            data-testid="vehicle-viewer-zoom"
            className="relative"
            style={{ width: `${zoomed ? ZOOM * 100 : 100}%`, height: `${zoomed ? ZOOM * 100 : 100}%` }}
          >
            <Image
              src={images[index]}
              alt={label}
              fill
              sizes="100vw"
              draggable={false}
              onClick={toggleZoom}
              className={`object-contain ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            />
          </div>
        </div>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} aria-label="Foto anterior" className={`absolute left-3 top-1/2 -translate-y-1/2 ${roundButton}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19 8 12l7-7" />
              </svg>
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Próxima foto" className={`absolute right-3 top-1/2 -translate-y-1/2 ${roundButton}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
