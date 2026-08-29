import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

// `vi.hoisted` so the mock factory below can read this box (Vitest 2.1.1 hoisting bug).
const { imageRows } = vi.hoisted(() => ({ imageRows: { current: [] as any[] } }))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'vehicle_images') {
        const imageChain: any = {
          select: () => imageChain,
          in: () => imageChain,
          order: async () => ({ data: imageRows.current, error: null }),
        }
        return imageChain
      }
      return {
        select: function () { return this },
        eq: function () { return this },
        ilike: function () { return this },
        gte: function () { return this },
        lte: function () { return this },
        order: async () => ({
          data: [{ id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive', year_model: 2023, price_cents: 6490000 }],
          error: null,
        }),
      }
    },
    storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }) }) },
  })),
}))

import EstoquePage from '@/app/(public)/estoque/page'

describe('/estoque page', () => {
  beforeEach(() => { imageRows.current = [] })

  it('lists available vehicles with a link to their detail page', async () => {
    render(await EstoquePage({ searchParams: Promise.resolve({}) }))
    const link = screen.getByRole('link', { name: /fiat argo/i })
    expect(link).toHaveAttribute('href', '/estoque/fiat-argo-2023')
    expect(screen.getByText('R$ 64.900')).toBeInTheDocument()
  })

  it('shows a placeholder block, never a broken image, for a vehicle with no photos', async () => {
    render(await EstoquePage({ searchParams: Promise.resolve({}) }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('vehicle-card-placeholder')).toBeInTheDocument()
  })

  it('shows the primary photo of a vehicle that has one', async () => {
    imageRows.current = [{ id: 'i1', vehicle_id: '1', storage_path: 'argo.jpg', display_order: 0 }]
    render(await EstoquePage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByRole('img', { name: /fiat argo/i })).toHaveAttribute('src', 'https://cdn.test/argo.jpg')
  })
})
