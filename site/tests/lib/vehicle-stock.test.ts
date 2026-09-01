import { describe, it, expect } from 'vitest'
import {
  daysInStock, hasMarginDefined, countStockFilters, applyStockFilter, matchesStockSearch, parseTurnoverThreshold,
} from '@/lib/vehicle-stock'

const NOW = new Date('2026-09-01T12:00:00.000Z')

function makeVehicle(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'v-1', status: 'available', brand: 'Fiat', model: 'Argo', version: 'Drive', color: 'Branco',
    acquisition_cost_cents: null, min_sale_price_cents: null,
    acquired_at: null, created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('daysInStock', () => {
  it('counts from acquired_at when present', () => {
    expect(daysInStock(makeVehicle({ acquired_at: '2026-08-01' }), NOW)).toBe(31)
  })

  it('falls back to created_at when acquired_at is missing', () => {
    expect(daysInStock(makeVehicle({ acquired_at: null, created_at: '2026-08-20T00:00:00.000Z' }), NOW)).toBe(12)
  })

  it('never returns a negative number for a future date', () => {
    expect(daysInStock(makeVehicle({ acquired_at: '2026-09-05' }), NOW)).toBe(0)
  })
})

describe('hasMarginDefined', () => {
  it('is false when acquisition cost or minimum price is missing', () => {
    expect(hasMarginDefined(makeVehicle({ acquisition_cost_cents: 100, min_sale_price_cents: null }))).toBe(false)
    expect(hasMarginDefined(makeVehicle({ acquisition_cost_cents: null, min_sale_price_cents: 100 }))).toBe(false)
  })

  it('is true when both are set', () => {
    expect(hasMarginDefined(makeVehicle({ acquisition_cost_cents: 100, min_sale_price_cents: 200 }))).toBe(true)
  })
})

describe('countStockFilters / applyStockFilter', () => {
  const vehicles = [
    makeVehicle({ id: 'a', status: 'available', acquisition_cost_cents: 100, min_sale_price_cents: 200, acquired_at: '2026-08-01' }),
    makeVehicle({ id: 'b', status: 'available', acquisition_cost_cents: null, min_sale_price_cents: null, acquired_at: '2026-05-01' }),
    makeVehicle({ id: 'c', status: 'preparing', acquisition_cost_cents: null, min_sale_price_cents: null }),
    makeVehicle({ id: 'd', status: 'sold', acquisition_cost_cents: 100, min_sale_price_cents: 200 }),
  ]

  it('counts every filter bucket', () => {
    expect(countStockFilters(vehicles, 90, NOW)).toEqual({ all: 4, no_margin: 2, turnover: 1, preparing: 1 })
  })

  it('"no_margin" includes any non-sold vehicle without a margin, but excludes sold ones', () => {
    const sold = makeVehicle({ id: 'e', status: 'sold', acquisition_cost_cents: null, min_sale_price_cents: null })
    expect(applyStockFilter([...vehicles, sold], 'no_margin', 90, NOW).map((v) => v.id)).toEqual(['b', 'c'])
  })

  it('"turnover" only considers available vehicles past the threshold', () => {
    expect(applyStockFilter(vehicles, 'turnover', 90, NOW).map((v) => v.id)).toEqual(['b'])
  })

  it('"preparing" returns only vehicles in that status', () => {
    expect(applyStockFilter(vehicles, 'preparing', 90, NOW).map((v) => v.id)).toEqual(['c'])
  })

  it('"all" returns every vehicle unfiltered', () => {
    expect(applyStockFilter(vehicles, 'all', 90, NOW).map((v) => v.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('matchesStockSearch', () => {
  const vehicle = makeVehicle({ brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', color: 'Branco' })

  it('matches brand, model, version, or color case-insensitively', () => {
    expect(matchesStockSearch(vehicle, 'fiat')).toBe(true)
    expect(matchesStockSearch(vehicle, 'ARGO')).toBe(true)
    expect(matchesStockSearch(vehicle, 'branco')).toBe(true)
  })

  it('returns true for an empty or blank query', () => {
    expect(matchesStockSearch(vehicle, '')).toBe(true)
    expect(matchesStockSearch(vehicle, '   ')).toBe(true)
  })

  it('returns false when nothing matches', () => {
    expect(matchesStockSearch(vehicle, 'volkswagen')).toBe(false)
  })
})

describe('parseTurnoverThreshold', () => {
  it('parses a valid numeric string', () => {
    expect(parseTurnoverThreshold('120')).toBe(120)
  })

  it('falls back to 90 for null, empty, zero, or non-numeric input', () => {
    expect(parseTurnoverThreshold(null)).toBe(90)
    expect(parseTurnoverThreshold('')).toBe(90)
    expect(parseTurnoverThreshold('0')).toBe(90)
    expect(parseTurnoverThreshold('abc')).toBe(90)
  })
})
