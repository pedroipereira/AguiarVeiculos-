import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// next/font/google needs Next's SWC build pipeline to resolve real font files;
// under plain Vite/Vitest it isn't a callable export at all, so components
// that load a font (e.g. src/lib/fonts.ts) would throw during render.
vi.mock('next/font/google', () => ({
  Anton: () => ({ className: 'font-anton' }),
}))
