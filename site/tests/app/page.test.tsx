import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => {
      const result = { data: [], error: null }
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        // `order` must stay chainable (EstoqueDestaque chains `.limit()` after it)
        // while the whole chain remains awaitable directly (Depoimentos awaits
        // `.order(...)` as its terminal call), so the chain is thenable too.
        order: () => chain,
        limit: async () => result,
        maybeSingle: async () => ({ data: null, error: null }),
        then: (resolve: (value: typeof result) => void) => resolve(result),
      }
      return chain
    },
  })),
}))

import Home from '@/app/(public)/page'

describe('Home page', () => {
  it('renders sections in the spec order: hero, estoque, financiamento, sobre a loja, galeria, contato', async () => {
    render(await Home())
    const headings = screen.getAllByRole('heading', { level: 1 }).concat(screen.getAllByRole('heading', { level: 2 }))
    const text = headings.map((h) => h.textContent)
    expect(text[0]).toMatch(/confiança/i)
    expect(text).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/financiamento e avaliação/i),
        expect.stringMatching(/sobre a aguiar veículos/i),
        expect.stringMatching(/showroom/i),
        expect.stringMatching(/vamos achar o seu carro/i),
      ]),
    )
  })
})
