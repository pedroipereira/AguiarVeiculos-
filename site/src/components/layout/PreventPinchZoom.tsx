'use client'

import { useEffect } from 'react'

/**
 * iPhones ignore `user-scalable=no` and still zoom with two fingers. Their pinch gesture can be
 * cancelled here. Renders nothing.
 */
export function PreventPinchZoom() {
  useEffect(() => {
    const stop = (event: Event) => event.preventDefault()
    document.addEventListener('gesturestart', stop)
    return () => document.removeEventListener('gesturestart', stop)
  }, [])
  return null
}
