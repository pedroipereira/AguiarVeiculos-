import { describe, it, expect, vi } from 'vitest'
import {
  getFeaturedVehicles, getAvailableVehicles, getVehicleBySlug, getVehicleFacets, getRelatedVehicles, getSitemapVehicles,
} from '@/lib/queries/vehicles'

function makeFakeClient(rows: any[]) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(async () => ({ data: rows, error: null })),
    maybeSingle: vi.fn(async () => ({ data: rows[0] ?? null, error: null })),
    then: (resolve: any) => resolve({ data: rows, error: null }),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('getFeaturedVehicles', () => {
  it('queries vehicles_public filtered by is_featured', async () => {
    const client = makeFakeClient([{ id: '1', slug: 'a', is_featured: true }])
    const result = await getFeaturedVehicles(client as any, 6)
    expect(client.from).toHaveBeenCalledWith('vehicles_public')
    expect(result).toEqual([{ id: '1', slug: 'a', is_featured: true }])
  })
})

describe('getSitemapVehicles', () => {
  it('queries vehicles_public for slug and updated_at, restricted to available vehicles', async () => {
    const client = makeFakeClient([{ slug: 'a', updated_at: '2026-09-01T00:00:00.000Z' }])
    const result = await getSitemapVehicles(client as any)
    expect(client.from).toHaveBeenCalledWith('vehicles_public')
    expect(client.chain.select).toHaveBeenCalledWith('slug, updated_at')
    expect(client.chain.eq).toHaveBeenCalledWith('status', 'available')
    expect(result).toEqual([{ slug: 'a', updated_at: '2026-09-01T00:00:00.000Z' }])
  })
})

describe('getRelatedVehicles', () => {
  it('excludes the given vehicle, stays within available status, and limits the count', async () => {
    const client = makeFakeClient([{ id: '2', slug: 'b' }])
    const result = await getRelatedVehicles(client as any, '1', 3)
    expect(client.from).toHaveBeenCalledWith('vehicles_public')
    expect(client.chain.eq).toHaveBeenCalledWith('status', 'available')
    expect(client.chain.neq).toHaveBeenCalledWith('id', '1')
    expect(client.chain.limit).toHaveBeenCalledWith(3)
    expect(result).toEqual([{ id: '2', slug: 'b' }])
  })

  it('defaults to a limit of 3 vehicles', async () => {
    const client = makeFakeClient([])
    await getRelatedVehicles(client as any, '1')
    expect(client.chain.limit).toHaveBeenCalledWith(3)
  })
})

describe('getAvailableVehicles', () => {
  it('returns available vehicles applying the brands filter', async () => {
    const client = makeFakeClient([{ id: '2', slug: 'b', brand: 'Fiat' }])
    const result = await getAvailableVehicles(client as any, { brands: ['Fiat'] })
    expect(result).toEqual([{ id: '2', slug: 'b', brand: 'Fiat' }])
  })

  it('matches any of the selected brands with an exact "in" filter', async () => {
    const client = makeFakeClient([{ id: '2', slug: 'b', brand: 'Fiat' }])
    await getAvailableVehicles(client as any, { brands: ['Fiat', 'Audi'] })
    expect(client.chain.in).toHaveBeenCalledWith('brand', ['Fiat', 'Audi'])
  })

  it('omits the brand filter entirely when no brands are selected', async () => {
    const client = makeFakeClient([])
    await getAvailableVehicles(client as any, { brands: [] })
    expect(client.chain.in).not.toHaveBeenCalled()
  })

  it('keeps minYear as a lower bound and price as a range', async () => {
    const client = makeFakeClient([])
    await getAvailableVehicles(client as any, { minYear: 2020, minPriceCents: 5000000, maxPriceCents: 9000000 })
    expect(client.chain.gte).toHaveBeenCalledWith('year_model', 2020)
    expect(client.chain.gte).toHaveBeenCalledWith('price_cents', 5000000)
    expect(client.chain.lte).toHaveBeenCalledWith('price_cents', 9000000)
  })

  it('filters by max mileage, transmission and fuel type loosely, and by free-text search', async () => {
    const client = makeFakeClient([])
    await getAvailableVehicles(client as any, {
      maxMileageKm: 50000,
      transmission: 'Automático',
      fuelType: 'Flex',
      search: 'polo',
    })
    expect(client.chain.lte).toHaveBeenCalledWith('mileage_km', 50000)
    expect(client.chain.ilike).toHaveBeenCalledWith('transmission', '%Automático%')
    expect(client.chain.ilike).toHaveBeenCalledWith('fuel_type', '%Flex%')
    expect(client.chain.or).toHaveBeenCalledWith('brand.ilike.%polo%,model.ilike.%polo%')
  })

  it('defaults to sorting by most recent, and applies the requested sort otherwise', async () => {
    const client = makeFakeClient([])
    await getAvailableVehicles(client as any, {})
    expect(client.chain.order).toHaveBeenCalledWith('created_at', { ascending: false })

    const client2 = makeFakeClient([])
    await getAvailableVehicles(client2 as any, { sort: 'price_asc' })
    expect(client2.chain.order).toHaveBeenCalledWith('price_cents', { ascending: true })

    const client3 = makeFakeClient([])
    await getAvailableVehicles(client3 as any, { sort: 'mileage_asc' })
    expect(client3.chain.order).toHaveBeenCalledWith('mileage_km', { ascending: true })
  })
})

describe('getVehicleFacets', () => {
  it('returns brand counts, the minimum price, the mileage range, and the distinct transmissions and fuel types', async () => {
    const client = makeFakeClient([
      { brand: 'Fiat', price_cents: 8000000, mileage_km: 10000, transmission: 'Manual', fuel_type: 'Flex' },
      { brand: 'Volkswagen', price_cents: 9500000, mileage_km: 30000, transmission: 'Automático', fuel_type: 'Flex' },
      { brand: 'Fiat', price_cents: 6000000, mileage_km: 50000, transmission: 'Manual', fuel_type: null },
    ])
    const result = await getVehicleFacets(client as any)
    expect(result).toEqual({
      brands: [
        { brand: 'Fiat', count: 2 },
        { brand: 'Volkswagen', count: 1 },
      ],
      minPriceCents: 6000000,
      mileageRangeKm: { min: 0, max: 50000 },
      transmissions: ['Automático', 'Manual'],
      fuelTypes: ['Flex'],
    })
  })
})

describe('getVehicleBySlug', () => {
  it('returns null when no vehicle matches', async () => {
    const client = makeFakeClient([])
    const result = await getVehicleBySlug(client as any, 'nao-existe')
    expect(result).toBeNull()
  })

  it('returns the vehicle when found', async () => {
    const client = makeFakeClient([{ id: '3', slug: 'vw-polo-2026' }])
    const result = await getVehicleBySlug(client as any, 'vw-polo-2026')
    expect(result).toEqual({ id: '3', slug: 'vw-polo-2026' })
  })

  it('excludes sold vehicles so their detail page falls through to the friendly 404', async () => {
    const client = makeFakeClient([])
    await getVehicleBySlug(client as any, 'vw-polo-2026')
    expect(client.chain.eq).toHaveBeenCalledWith('slug', 'vw-polo-2026')
    expect(client.chain.eq).toHaveBeenCalledWith('status', 'available')
  })
})
