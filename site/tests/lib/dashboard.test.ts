import { describe, it, expect } from 'vitest'
import { calculateGoalProgress, resolveDateRange } from '@/lib/dashboard'

describe('calculateGoalProgress', () => {
  it('returns null when no goal is set', () => {
    expect(calculateGoalProgress(5, null, new Date(2026, 8, 1))).toBeNull()
  })

  it('returns null when the goal is zero or negative', () => {
    expect(calculateGoalProgress(5, 0, new Date(2026, 8, 1))).toBeNull()
    expect(calculateGoalProgress(5, -3, new Date(2026, 8, 1))).toBeNull()
  })

  it('computes percent and remaining, counting all weekdays in the month from the 1st', () => {
    // 2026-09-01 is a Tuesday; September 2026 has 22 weekdays total.
    const result = calculateGoalProgress(12, 20, new Date(2026, 8, 1))
    expect(result).toEqual({ percent: 60, remaining: 8, businessDaysLeft: 22 })
  })

  it('counts remaining business days from a weekday "now" through end of month, excluding weekends', () => {
    // 2026-09-25 is a Friday; weekdays left in September from the 25th: 25(Fri),28(Mon),29(Tue),30(Wed) = 4.
    const result = calculateGoalProgress(10, 20, new Date(2026, 8, 25))
    expect(result?.businessDaysLeft).toBe(4)
  })

  it('counts remaining business days from a weekend "now", excluding today itself', () => {
    // 2026-09-27 is a Sunday; weekdays left: 28(Mon),29(Tue),30(Wed) = 3.
    const result = calculateGoalProgress(10, 20, new Date(2026, 8, 27))
    expect(result?.businessDaysLeft).toBe(3)
  })

  it('floors remaining at zero and allows percent over 100 once the goal is exceeded', () => {
    const result = calculateGoalProgress(25, 20, new Date(2026, 8, 1))
    expect(result?.remaining).toBe(0)
    expect(result?.percent).toBe(125)
  })
})

describe('resolveDateRange', () => {
  const NOW = new Date(2026, 8, 25) // Friday, September 25th 2026

  it('resolves "today" and "yesterday" as single-day ranges', () => {
    expect(resolveDateRange('today', NOW)).toEqual({ start: '2026-09-25', end: '2026-09-25' })
    expect(resolveDateRange('yesterday', NOW)).toEqual({ start: '2026-09-24', end: '2026-09-24' })
  })

  it('resolves "week" as the Monday-Sunday containing "now"', () => {
    expect(resolveDateRange('week', NOW)).toEqual({ start: '2026-09-21', end: '2026-09-27' })
  })

  it('resolves "week" the same way when "now" itself falls on a Sunday', () => {
    expect(resolveDateRange('week', new Date(2026, 8, 27))).toEqual({ start: '2026-09-21', end: '2026-09-27' })
  })

  it('resolves "month" as the full current calendar month', () => {
    expect(resolveDateRange('month', NOW)).toEqual({ start: '2026-09-01', end: '2026-09-30' })
  })

  it('resolves "year" as the full current calendar year', () => {
    expect(resolveDateRange('year', NOW)).toEqual({ start: '2026-01-01', end: '2026-12-31' })
  })

  it('passes "custom" through unchanged, including an inverted range', () => {
    expect(resolveDateRange('custom', NOW, { start: '2026-01-10', end: '2026-01-05' })).toEqual({
      start: '2026-01-10',
      end: '2026-01-05',
    })
  })
})

import { getSalesPanelMetrics } from '@/lib/dashboard'
import type { Vehicle } from '@/lib/types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2024, year_fabrication: 2024, mileage_km: 10000, price_cents: 8000000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null,
    horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null,
    fipe_value_cents: null, fipe_fetched_at: null, optionals: [],
    ...overrides,
  }
}

describe('getSalesPanelMetrics', () => {
  const range = { start: '2026-09-01', end: '2026-09-30' }

  it('counts only vehicles sold within the range', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-15', sale_price_cents: 5000000 }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-08-31', sale_price_cents: 4000000 }),
      makeVehicle({ id: 'c', status: 'available', sold_at: null }),
    ]
    expect(getSalesPanelMetrics(vehicles, {}, range).count).toBe(1)
  })

  it('sums sale_price_cents as revenue', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-01', sale_price_cents: 5000000 }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-09-30', sale_price_cents: 3000000 }),
    ]
    expect(getSalesPanelMetrics(vehicles, {}, range).revenueCents).toBe(8000000)
  })

  it('sums realized margin (sale price minus acquisition cost minus expenses) as profit', () => {
    const vehicles = [
      makeVehicle({
        id: 'a', status: 'sold', sold_at: '2026-09-10',
        sale_price_cents: 5000000, acquisition_cost_cents: 3000000,
      }),
    ]
    // profit = 5,000,000 - 3,000,000 - 200,000 (expenses) = 1,800,000
    expect(getSalesPanelMetrics(vehicles, { a: 200000 }, range).profitCents).toBe(1800000)
  })

  it('returns zeros for an empty (inverted custom) range', () => {
    const vehicles = [makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000 })]
    const inverted = { start: '2026-09-20', end: '2026-09-10' }
    expect(getSalesPanelMetrics(vehicles, {}, inverted)).toEqual({ count: 0, revenueCents: 0, profitCents: 0 })
  })
})
