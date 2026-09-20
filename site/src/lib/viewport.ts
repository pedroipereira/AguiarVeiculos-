import type { Viewport } from 'next'

/** The public pages do not let the visitor zoom (the admin keeps the default viewport). */
export const noZoomViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
