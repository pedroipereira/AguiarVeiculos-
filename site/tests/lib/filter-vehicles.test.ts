import { describe, it, expect } from 'vitest'
import { parseVehicleFiltersFromSearchParams } from '@/lib/filter-vehicles'

describe('parseVehicleFiltersFromSearchParams', () => {
  it('parses brand, year, and price range from query params', () => {
    const filters = parseVehicleFiltersFromSearchParams({ brand: 'Fiat', year: '2023', minPrice: '5000000', maxPrice: '9000000' })
    expect(filters).toEqual({ brand: 'Fiat', year: 2023, minPriceCents: 5000000, maxPriceCents: 9000000 })
  })

  it('omits keys that are missing or empty', () => {
    expect(parseVehicleFiltersFromSearchParams({})).toEqual({})
    expect(parseVehicleFiltersFromSearchParams({ brand: '' })).toEqual({})
  })

  it('ignores a non-numeric year instead of producing NaN', () => {
    expect(parseVehicleFiltersFromSearchParams({ year: 'abc' })).toEqual({})
    expect(parseVehicleFiltersFromSearchParams({ brand: 'Fiat', year: 'abc' })).toEqual({ brand: 'Fiat' })
  })

  it('ignores non-numeric price params too', () => {
    expect(parseVehicleFiltersFromSearchParams({ minPrice: 'barato', maxPrice: 'caro' })).toEqual({})
    expect(parseVehicleFiltersFromSearchParams({ minPrice: 'Infinity' })).toEqual({})
  })
})
