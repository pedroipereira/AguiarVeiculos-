import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => ({
      select: function () { return this },
      eq: function () { return this },
      gte: function () { return this },
      lte: function () { return this },
      order: async () => ({
        data: [{ id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive', year_model: 2023, price_cents: 6490000 }],
        error: null,
      }),
    }),
  })),
}))

import EstoquePage from '@/app/estoque/page'

describe('/estoque page', () => {
  it('lists available vehicles with a link to their detail page', async () => {
    render(await EstoquePage({ searchParams: Promise.resolve({}) }))
    const link = screen.getByRole('link', { name: /fiat argo/i })
    expect(link).toHaveAttribute('href', '/estoque/fiat-argo-2023')
    expect(screen.getByText('R$ 64.900')).toBeInTheDocument()
  })
})
