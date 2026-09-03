import { vi } from 'vitest'

const { chain } = vi.hoisted(() => ({
  chain: {
    select: vi.fn(function (this: any) { return this }),
    eq: vi.fn(function (this: any) { return this }),
    order: vi.fn(function (this: any) { return this }),
    then: (resolve: (value: { data: any[]; error: null }) => void) =>
      resolve({
        data: [
          { slug: 'fiat-argo-2023-abc', updated_at: '2026-09-01T00:00:00.000Z' },
          { slug: 'vw-polo-2022-xyz', updated_at: '2026-08-15T00:00:00.000Z' },
        ],
        error: null,
      }),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from: () => chain })),
}))

import sitemap from '@/app/sitemap'
import { SITE_URL } from '@/lib/seo'

describe('sitemap', () => {
  it('includes the static routes and one entry per available vehicle', async () => {
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain(SITE_URL)
    expect(urls).toContain(`${SITE_URL}/estoque`)
    expect(urls).toContain(`${SITE_URL}/financiamento`)
    expect(urls).toContain(`${SITE_URL}/estoque/fiat-argo-2023-abc`)
    expect(urls).toContain(`${SITE_URL}/estoque/vw-polo-2022-xyz`)
  })

  it('sets lastModified from the vehicle\'s updated_at for vehicle entries', async () => {
    const entries = await sitemap()
    const argo = entries.find((entry) => entry.url === `${SITE_URL}/estoque/fiat-argo-2023-abc`)
    expect(argo?.lastModified).toBe('2026-09-01T00:00:00.000Z')
  })
})
