import { describe, it, expect } from 'vitest'
import { parseVehicleFiltersFromSearchParams } from '@/lib/filter-vehicles'

describe('parseVehicleFiltersFromSearchParams', () => {
  it('parses brands (comma-separated), minYear, and price range from query params', () => {
    const filters = parseVehicleFiltersFromSearchParams({
      brands: 'Fiat,Audi',
      minYear: '2020',
      minPrice: '5000000',
      maxPrice: '9000000',
    })
    expect(filters).toEqual({ brands: ['Fiat', 'Audi'], minYear: 2020, minPriceCents: 5000000, maxPriceCents: 9000000 })
  })

  it('omits keys that are missing or empty', () => {
    expect(parseVehicleFiltersFromSearchParams({})).toEqual({})
    expect(parseVehicleFiltersFromSearchParams({ brands: '' })).toEqual({})
  })

  it('ignores a non-numeric minYear instead of producing NaN', () => {
    expect(parseVehicleFiltersFromSearchParams({ minYear: 'abc' })).toEqual({})
    expect(parseVehicleFiltersFromSearchParams({ brands: 'Fiat', minYear: 'abc' })).toEqual({ brands: ['Fiat'] })
  })

  it('ignores non-numeric price params too', () => {
    expect(parseVehicleFiltersFromSearchParams({ minPrice: 'barato', maxPrice: 'caro' })).toEqual({})
    expect(parseVehicleFiltersFromSearchParams({ minPrice: 'Infinity' })).toEqual({})
  })

  it('parses mileage, transmission, fuel type, search and sort', () => {
    const filters = parseVehicleFiltersFromSearchParams({
      maxMileage: '50000',
      transmission: 'Automático',
      fuelType: 'Flex',
      search: 'polo',
      sort: 'price_asc',
    })
    expect(filters).toEqual({
      maxMileageKm: 50000,
      transmission: 'Automático',
      fuelType: 'Flex',
      search: 'polo',
      sort: 'price_asc',
    })
  })

  it('ignores an unrecognized sort value instead of passing it through', () => {
    expect(parseVehicleFiltersFromSearchParams({ sort: 'random' })).toEqual({})
  })
})
