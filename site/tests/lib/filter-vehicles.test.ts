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
})
