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
  it('renders sections in order: hero, financiamento, sobre a loja, galeria, experiência', async () => {
    render(await Home())
    const headings = screen.getAllByRole('heading', { level: 1 }).concat(screen.getAllByRole('heading', { level: 2 }))
    const text = headings.map((h) => h.textContent ?? '')
    expect(text[0]).toMatch(/confiança/i)
    const position = (pattern: RegExp) => text.findIndex((heading) => pattern.test(heading))
    const order = [/financiamento e avaliação/i, /sobre a aguiar veículos/i, /showroom/i, /venha viver a experiência aguiar/i].map(position)
    expect(order.every((index) => index > 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('is all one near-black gray, apart from the showroom photo section (no vehicles or testimonials in this fake data)', async () => {
    const { container } = render(await Home())
    const sections = [...container.querySelectorAll('main > section')]
    const byHeading = (name: RegExp) => screen.getByRole('heading', { level: 2, name }).closest('section')!
    for (const section of [
      byHeading(/financiamento e avaliação/i),
      container.querySelector('section#quinze-anos')!,
      container.querySelector('section#como-chegar')!,
    ]) {
      expect(section).toHaveClass('bg-charcoal')
    }
    expect(sections.filter((section) => section.classList.contains('bg-graphite')).length).toBe(1)
    expect(container.querySelectorAll('main > section.bg-paper, main > section.bg-white').length).toBe(0)
  })
})
