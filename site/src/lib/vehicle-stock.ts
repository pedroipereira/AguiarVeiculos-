import type { Vehicle } from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const DEFAULT_TURNOVER_THRESHOLD_DAYS = 90

type StockVehicle = Pick<Vehicle, 'status' | 'acquisition_cost_cents' | 'min_sale_price_cents' | 'acquired_at' | 'created_at'>
type SearchableVehicle = Pick<Vehicle, 'brand' | 'model' | 'version' | 'color' | 'year_model'>

export function daysInStock(vehicle: Pick<Vehicle, 'acquired_at' | 'created_at'>, now: Date = new Date()): number {
  const referenceDate = new Date(vehicle.acquired_at ?? vehicle.created_at)
  const diffMs = now.getTime() - referenceDate.getTime()
  return Math.max(0, Math.floor(diffMs / MS_PER_DAY))
}

export function hasMarginDefined(vehicle: Pick<Vehicle, 'acquisition_cost_cents' | 'min_sale_price_cents'>): boolean {
  return vehicle.acquisition_cost_cents != null && vehicle.min_sale_price_cents != null
}

export type StockFilter = 'all' | 'no_margin' | 'turnover' | 'preparing'

export interface StockFilterCounts {
  all: number
  no_margin: number
  turnover: number
  preparing: number
}

function isNoMargin(vehicle: StockVehicle): boolean {
  return vehicle.status !== 'sold' && !hasMarginDefined(vehicle)
}

function isTurnoverStale(vehicle: StockVehicle, thresholdDays: number, now: Date): boolean {
  return vehicle.status === 'available' && daysInStock(vehicle, now) >= thresholdDays
}

export function countStockFilters(
  vehicles: StockVehicle[],
  thresholdDays: number,
  now: Date = new Date(),
): StockFilterCounts {
  return {
    all: vehicles.length,
    no_margin: vehicles.filter((v) => isNoMargin(v)).length,
    turnover: vehicles.filter((v) => isTurnoverStale(v, thresholdDays, now)).length,
    preparing: vehicles.filter((v) => v.status === 'preparing').length,
  }
}

export function applyStockFilter<T extends StockVehicle>(
  vehicles: T[],
  filter: StockFilter,
  thresholdDays: number,
  now: Date = new Date(),
): T[] {
  switch (filter) {
    case 'no_margin':
      return vehicles.filter((v) => isNoMargin(v))
    case 'turnover':
      return vehicles.filter((v) => isTurnoverStale(v, thresholdDays, now))
    case 'preparing':
      return vehicles.filter((v) => v.status === 'preparing')
    default:
      return vehicles
  }
}

export function matchesStockSearch(vehicle: SearchableVehicle, query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true
  const haystack = [vehicle.brand, vehicle.model, vehicle.version, vehicle.color, String(vehicle.year_model)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(trimmed)
}

/** Parses the `stock_turnover_threshold_days` site_settings value, falling back to 90. */
export function parseTurnoverThreshold(raw: string | null): number {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TURNOVER_THRESHOLD_DAYS
}
