import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { vi } from 'vitest'

// next/font/google needs Next's SWC build pipeline to resolve real font files;
// under plain Vite/Vitest it isn't a callable export at all, so components
// that load a font (e.g. src/lib/fonts.ts) would throw during render.
vi.mock('next/font/google', () => ({
  Anton: () => ({ className: 'font-anton' }),
}))

// next/image's real loader needs the Next.js server/build pipeline to resolve
// srcset URLs; under plain Vite/Vitest it would rewrite `src` to a
// `/_next/image?url=...` proxy URL, breaking tests that assert on the exact
// `src` they passed in. This renders it as a plain <img> instead, dropping
// the Image-only props that don't apply to a raw element.
vi.mock('next/image', () => ({
  default: ({ fill, priority, sizes, unoptimized, loader, ...rest }: Record<string, unknown>) =>
    createElement('img', rest),
}))

// Recharts' ResponsiveContainer (used by the Painel's charts) reads
// ResizeObserver to measure its container; jsdom doesn't implement it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub
