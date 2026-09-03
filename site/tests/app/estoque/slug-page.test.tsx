import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { notFound } from 'next/navigation'

vi.mock('next/navigation', () => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))

// `vi.hoisted` so the mock factory below can read these (Vitest 2.1.1 hoisting bug).
const { maybeSingle, vehicleEq, imageRows, relatedRows } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  vehicleEq: vi.fn(),
  imageRows: { current: [] as any[] },
  relatedRows: { current: [] as any[] },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'vehicle_images') {
        const imageChain: any = {
          select: () => imageChain,
          eq: () => imageChain,
          in: () => imageChain,
          order: () => imageChain,
          then: (resolve: (value: { data: any[]; error: null }) => void) => resolve({ data: imageRows.current, error: null }),
        }
        return imageChain
      }
      // `vehicles_public`: `getVehicleBySlug` resolves via `.maybeSingle()`, while
      // `getRelatedVehicles` chains `.neq().order().limit()` and awaits the chain
      // itself — both paths share this one thenable/maybeSingle-able object.
      const vehicleChain: any = {
        select: () => vehicleChain,
        eq: (column: string, value: unknown) => { vehicleEq(column, value); return vehicleChain },
        neq: () => vehicleChain,
        order: () => vehicleChain,
        limit: () => vehicleChain,
        maybeSingle,
        then: (resolve: (value: { data: any[]; error: null }) => void) => resolve({ data: relatedRows.current, error: null }),
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
  status: 'available', optionals: [],
}

describe('/estoque/[slug] page', () => {
  beforeEach(() => {
    imageRows.current = []
    relatedRows.current = []
    vehicleEq.mockClear()
  })

  it('renders vehicle details, price, and a WhatsApp interest link, never the plate', async () => {
    // Defensive: even if a future bug lets `plate` leak through the query result,
    // the page must never render it.
    maybeSingle.mockResolvedValueOnce({ data: { ...argo, plate: 'DEF4G56' }, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getAllByText('R$ 64.900').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /falar com um vendedor/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    )
    expect(document.body.textContent).not.toContain('DEF4G56')
  })

  it('shows the "Equipamentos e opcionais" section when the vehicle has optionals marked', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { ...argo, optionals: ['Ar condicionado', 'Outros'] }, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByText('Equipamentos e opcionais')).toBeInTheDocument()
    expect(screen.getByText('Ar condicionado')).toBeInTheDocument()
    expect(screen.getByText('Outros')).toBeInTheDocument()
  })

  it('omits the "Equipamentos e opcionais" section when the vehicle has no optionals marked', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.queryByText('Equipamentos e opcionais')).not.toBeInTheDocument()
  })

  it('renders the highlight grid, ficha técnica, and description with the vehicle data', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    // Highlights (Ano, Km, Câmbio, Combustível, Cor) — shown once, up top.
    expect(screen.getAllByText('2023').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/32\.000 km/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Manual').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Flex').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Prata').length).toBeGreaterThan(0)
    // Ficha técnica holds only what isn't already in the highlights above.
    expect(screen.getByText('Modelo')).toBeInTheDocument()
    expect(screen.getByText('Versão')).toBeInTheDocument()
    expect(screen.getByText('Drive 1.0')).toBeInTheDocument()
    expect(screen.getByText('Ficha técnica')).toBeInTheDocument()
    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByText('Ótimo estado')).toBeInTheDocument()
  })

  it('adds motor, fuel tank, and seating capacity to ficha técnica when the vehicle has them', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { ...argo, engine: '1.6', fuel_tank_liters: 55, seating_capacity: 5 },
      error: null,
    })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByText('Motor')).toBeInTheDocument()
    expect(screen.getByText('1.6')).toBeInTheDocument()
    expect(screen.getByText('Tanque de combustível')).toBeInTheDocument()
    expect(screen.getByText('55 L')).toBeInTheDocument()
    expect(screen.getByText('Quantidade de pessoas')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('omits motor, fuel tank, and seating capacity from ficha técnica when the vehicle has none of them', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.queryByText('Motor')).not.toBeInTheDocument()
    expect(screen.queryByText('Tanque de combustível')).not.toBeInTheDocument()
    expect(screen.queryByText('Quantidade de pessoas')).not.toBeInTheDocument()
  })

  it('adds body type, doors, and horsepower to ficha técnica when the vehicle has them', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { ...argo, body_type: 'Hatch', doors: 4, horsepower: 115 },
      error: null,
    })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByText('Tipo de carroceria')).toBeInTheDocument()
    expect(screen.getByText('Hatch')).toBeInTheDocument()
    expect(screen.getByText('Portas')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Potência')).toBeInTheDocument()
    expect(screen.getByText('115 cv')).toBeInTheDocument()
  })

  it('omits body type, doors, and horsepower from ficha técnica when the vehicle has none of them', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.queryByText('Tipo de carroceria')).not.toBeInTheDocument()
    expect(screen.queryByText('Portas')).not.toBeInTheDocument()
    expect(screen.queryByText('Potência')).not.toBeInTheDocument()
  })

  it('shows a single main photo, with no thumbnail strip, when the vehicle has exactly one photo', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    imageRows.current = [{ id: 'i1', vehicle_id: '1', storage_path: 'argo-1.jpg', display_order: 0 }]
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByRole('img', { name: /fiat argo/i })).toHaveAttribute('src', 'https://cdn.test/argo-1.jpg')
    expect(screen.queryByLabelText(/próxima foto/i)).not.toBeInTheDocument()
  })

  it('renders a gallery with a main photo and clickable thumbnails when the vehicle has multiple photos', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    imageRows.current = [
      { id: 'i1', vehicle_id: '1', storage_path: 'argo-1.jpg', display_order: 0 },
      { id: 'i2', vehicle_id: '1', storage_path: 'argo-2.jpg', display_order: 1 },
    ]
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))

    const mainPhoto = screen.getByRole('img', { name: /fiat argo/i })
    expect(mainPhoto).toHaveAttribute('src', 'https://cdn.test/argo-1.jpg')
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    const secondThumbnail = screen.getByRole('button', { name: /ver foto 2 de fiat argo/i })
    fireEvent.click(secondThumbnail)
    expect(screen.getByRole('img', { name: /fiat argo/i })).toHaveAttribute('src', 'https://cdn.test/argo-2.jpg')
  })

  it('renders a placeholder block, never an empty gallery, when the vehicle has no photos', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.queryByRole('img', { name: /fiat argo/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('vehicle-gallery-placeholder')).toBeInTheDocument()
  })

  it('renders other available vehicles with a link to the full catalog', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    relatedRows.current = [
      {
        id: '2', slug: 'vw-polo-2022', brand: 'Volkswagen', model: 'Polo', version: 'MPI',
        year_model: 2022, mileage_km: 15000, price_cents: 8990000, status: 'available',
      },
    ]
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByText('Outros carros disponíveis')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volkswagen polo/i })).toHaveAttribute('href', '/estoque/vw-polo-2022')
    expect(screen.getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/estoque')
  })

  it('omits the "Outros carros disponíveis" section when there are no other vehicles', async () => {
    maybeSingle.mockResolvedValueOnce({ data: argo, error: null })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.queryByText('Outros carros disponíveis')).not.toBeInTheDocument()
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
