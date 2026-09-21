'use client'

import { useEffect, useState } from 'react'

interface VehicleStickyBarProps {
  price: string
  whatsappUrl: string
  /** The id of the main WhatsApp button of the page: the bar shows while that button is off the screen. */
  targetId: string
}

/**
 * A bar at the bottom of the phone screen with the price and a WhatsApp button, so the visitor never has to
 * scroll back up to talk to a seller. While it is on the page it replaces the round floating WhatsApp button
 * (see `globals.css`).
 */
export function VehicleStickyBar({ price, whatsappUrl, targetId }: VehicleStickyBarProps) {
  // Unknown until the browser reports it, so the bar never flashes in before it should.
  const [mainButtonOnScreen, setMainButtonOnScreen] = useState<boolean | null>(null)
  const [footerOnScreen, setFooterOnScreen] = useState(false)

  useEffect(() => {
    document.body.dataset.stickyBar = '1'
    const observers: IntersectionObserver[] = []
    if (typeof IntersectionObserver !== 'undefined') {
      const watch = (element: Element | null, onChange: (onScreen: boolean) => void) => {
        if (!element) return
        const observer = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting))
        observer.observe(element)
        observers.push(observer)
      }
      watch(document.getElementById(targetId), setMainButtonOnScreen)
      // At the end of the page the footer is what matters, so the bar steps aside instead of covering it.
      watch(document.querySelector('footer'), setFooterOnScreen)
    }
    return () => {
      observers.forEach((observer) => observer.disconnect())
      delete document.body.dataset.stickyBar
    }
  }, [targetId])

  const visible = mainButtonOnScreen === false && !footerOnScreen
  if (!visible) return null

  return (
    <div
      data-testid="vehicle-sticky-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-graphite/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur motion-safe:animate-[bar-in_220ms_ease-out] md:hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/85">Valor</p>
          <p className="text-xl font-bold leading-tight">{price}</p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-aguiar-red px-5 text-sm font-bold text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.148-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"
            />
          </svg>
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  )
}
