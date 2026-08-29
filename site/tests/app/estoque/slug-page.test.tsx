import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { notFound } from 'next/navigation'

vi.mock('next/navigation', () => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))

// `vi.hoisted` so the mock factory below can read these (Vitest 2.1.1 hoisting bug).
const { maybeSingle, vehicleEq, imageRows } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  vehicleEq: vi.fn(),
  imageRows: { current: [] as any[] },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'vehicle_images') {
        const imageChain: any = {
          select: () => imageChain,
          eq: () => imageChain,
          order: async () => ({ data: imageRows.current, error: null }),
        }
        return imageChain
      }
      const vehicleChain: any = {
        select: () => vehicleChain,
        eq: (column: string, value: unknown) => { vehicleEq(column, value); return vehicleChain },
        maybeSingle,
      }
      return vehicleChain
    },
    storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }) }) },
  })),
}))

import VehicleDetailPage from '@/app/(public)/estoque/[slug]/page'

const argo = {
  id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive 1.0',
  year_model: 2023, year_fabrication: 2023, mileage_km: 32000, price_cents: 6490000,
  fuel_type: 'Flex', transmission: 'Manual', color: 'Prata', description: 'Ótimo estado',
  status: 'available',
}

describe('/estoque/[slug] page', () => {
  beforeEach(() => { imageRows.current = []; vehicleEq.mockClear() })

  it('renders vehicle details, price, and a WhatsApp interest link, never the plate', async () => {
    // Defensive: even if a future bug lets `plate` leak through the query result,
    // the page must never render it.
    maybeSingle.mockResolvedValueOnce({ data: { ...argo, plate: 'DEF4G56' }, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByText('R$ 64.900')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tenho interesse/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    )
    expect(document.body.textContent).not.toContain('DEF4G56')
  })

  it('renders a photo gallery when the vehicle has images', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    imageRows.current = [
      { id: 'i1', vehicle_id: '1', storage_path: 'argo-1.jpg', display_order: 0 },
      { id: 'i2', vehicle_id: '1', storage_path: 'argo-2.jpg', display_order: 1 },
    ]
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    const images = screen.getAllByRole('img', { name: /fiat argo/i })
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://cdn.test/argo-1.jpg')
  })

  it('renders a placeholder block, never an empty gallery, when the vehicle has no photos', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('vehicle-gallery-placeholder')).toBeInTheDocument()
  })

  it('calls notFound() when the vehicle does not exist', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await expect(VehicleDetailPage({ params: Promise.resolve({ slug: 'nao-existe' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('shows the friendly 404 for a sold vehicle — the query itself filters on status available', async () => {
    // A sold vehicle is excluded by the query, so the page receives null and 404s.
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await expect(VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(vehicleEq).toHaveBeenCalledWith('status', 'available')
  })
})
