import { describe, it, expect } from 'vitest'
import { calculateTotalCostCents, calculateEstimatedMarginCents, calculateRealizedMarginCents } from '@/lib/vehicle-costs'

describe('calculateTotalCostCents', () => {
  it('sums acquisition cost and all expenses', () => {
    expect(calculateTotalCostCents(1000000, [{ amount_cents: 50000 }, { amount_cents: 20000 }])).toBe(1070000)
  })

  it('treats a missing acquisition cost as zero', () => {
    expect(calculateTotalCostCents(null, [{ amount_cents: 30000 }])).toBe(30000)
  })

  it('returns zero when there is no acquisition cost and no expenses', () => {
    expect(calculateTotalCostCents(null, [])).toBe(0)
  })
})

describe('calculateEstimatedMarginCents', () => {
  it('subtracts total cost from the listed price', () => {
    expect(calculateEstimatedMarginCents(6490000, 6000000)).toBe(490000)
  })

  it('returns a negative number when the vehicle is priced under cost', () => {
    expect(calculateEstimatedMarginCents(5000000, 6000000)).toBe(-1000000)
  })
})

describe('calculateRealizedMarginCents', () => {
  it('subtracts total cost from the actual sale price', () => {
    expect(calculateRealizedMarginCents(6200000, 6000000)).toBe(200000)
  })

  it('returns null when there is no sale price yet', () => {
    expect(calculateRealizedMarginCents(null, 6000000)).toBeNull()
    expect(calculateRealizedMarginCents(undefined, 6000000)).toBeNull()
  })
})
