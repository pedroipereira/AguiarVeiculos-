import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { notFound } from 'next/navigation'

vi.mock('next/navigation', () => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))

const maybeSingle = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => ({ select: function () { return this }, eq: function () { return this }, maybeSingle }),
  })),
}))

import VehicleDetailPage from '@/app/(public)/estoque/[slug]/page'

describe('/estoque/[slug] page', () => {
  it('renders vehicle details, price, and a WhatsApp interest link, never the plate', async () => {
    // Defensive: even if a future bug lets `plate` leak through the query result,
    // the page must never render it.
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive 1.0',
        year_model: 2023, year_fabrication: 2023, mileage_km: 32000, price_cents: 6490000,
        fuel_type: 'Flex', transmission: 'Manual', color: 'Prata', description: 'Ótimo estado',
        status: 'available', plate: 'DEF4G56',
      },
      error: null,
    })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByText('R$ 64.900')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tenho interesse/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    )
    expect(document.body.textContent).not.toContain('DEF4G56')
  })

  it('calls notFound() when the vehicle does not exist', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await expect(VehicleDetailPage({ params: Promise.resolve({ slug: 'nao-existe' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })
})
