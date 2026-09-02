import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// next/font/google needs Next's SWC build pipeline to resolve real font files;
// under plain Vite/Vitest it isn't a callable export at all, so components
// that load a font (e.g. src/lib/fonts.ts) would throw during render.
vi.mock('next/font/google', () => ({
  Anton: () => ({ className: 'font-anton' }),
}))

// Recharts' ResponsiveContainer (used by the Painel's charts) reads
// ResizeObserver to measure its container; jsdom doesn't implement it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error -- jsdom has no ResizeObserver; Recharts only needs the shape above.
global.ResizeObserver = ResizeObserverStub
