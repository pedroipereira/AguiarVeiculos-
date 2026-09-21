import { useRef, type TouchEvent } from 'react'

const MIN_DISTANCE = 50

/**
 * Touch handlers for a photo: `onNext` when the finger goes left, `onPrevious` when it goes right.
 * A short drag, or one that is mostly vertical, is ignored, so scrolling the page never changes the photo.
 */
export function useSwipe(onNext: () => void, onPrevious: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null)

  return {
    onTouchStart(event: TouchEvent) {
      const touch = event.touches[0]
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd(event: TouchEvent) {
      const from = start.current
      const touch = event.changedTouches[0]
      start.current = null
      if (!from || !touch) return
      const dx = touch.clientX - from.x
      const dy = touch.clientY - from.y
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
      if (dx < 0) onNext()
      else onPrevious()
    },
  }
}
