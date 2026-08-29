import type { VehicleFilters } from './queries/vehicles'

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

export function parseVehicleFiltersFromSearchParams(params: Record<string, string | undefined>): VehicleFilters {
  const filters: VehicleFilters = {}
  if (params.brand) filters.brand = params.brand

  const year = parseFiniteNumber(params.year)
  if (year !== undefined) filters.year = year

  const minPriceCents = parseFiniteNumber(params.minPrice)
  if (minPriceCents !== undefined) filters.minPriceCents = minPriceCents

  const maxPriceCents = parseFiniteNumber(params.maxPrice)
  if (maxPriceCents !== undefined) filters.maxPriceCents = maxPriceCents

  return filters
}
