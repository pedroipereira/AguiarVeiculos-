import type { VehicleFilters, VehicleSort } from './queries/vehicles'

/**
 * Numeric query params come straight from the URL, so a junk value like
 * `?year=abc` must be ignored (same as if the param were absent) instead of
 * producing a NaN that blows up the Supabase query.
 */
function parseFiniteNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

const VALID_SORTS: VehicleSort[] = ['recent', 'price_asc', 'price_desc', 'mileage_asc']

export function parseVehicleFiltersFromSearchParams(params: Record<string, string | undefined>): VehicleFilters {
  const filters: VehicleFilters = {}
  if (params.brands) {
    const brands = params.brands.split(',').filter(Boolean)
    if (brands.length > 0) filters.brands = brands
  }

  const minYear = parseFiniteNumber(params.minYear)
  if (minYear !== undefined) filters.minYear = minYear

  const minPriceCents = parseFiniteNumber(params.minPrice)
  if (minPriceCents !== undefined) filters.minPriceCents = minPriceCents

  const maxPriceCents = parseFiniteNumber(params.maxPrice)
  if (maxPriceCents !== undefined) filters.maxPriceCents = maxPriceCents

  const maxMileageKm = parseFiniteNumber(params.maxMileage)
  if (maxMileageKm !== undefined) filters.maxMileageKm = maxMileageKm

  if (params.transmission) filters.transmission = params.transmission
  if (params.fuelType) filters.fuelType = params.fuelType
  if (params.search) filters.search = params.search
  if (params.sort && VALID_SORTS.includes(params.sort as VehicleSort)) filters.sort = params.sort as VehicleSort

  return filters
}
