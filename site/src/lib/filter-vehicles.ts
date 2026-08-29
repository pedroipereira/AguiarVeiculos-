import type { VehicleFilters } from './queries/vehicles'

export function parseVehicleFiltersFromSearchParams(params: Record<string, string | undefined>): VehicleFilters {
  const filters: VehicleFilters = {}
  if (params.brand) filters.brand = params.brand
  if (params.year) filters.year = Number(params.year)
  if (params.minPrice) filters.minPriceCents = Number(params.minPrice)
  if (params.maxPrice) filters.maxPriceCents = Number(params.maxPrice)
  return filters
}
