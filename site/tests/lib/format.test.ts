import { describe, it, expect } from 'vitest'
import { formatPriceFromCents, buildVehicleSlug } from '@/lib/format'

describe('formatPriceFromCents', () => {
  it('formats cents as BRL without decimals for whole reais', () => {
    expect(formatPriceFromCents(8990000)).toBe('R$ 89.900')
  })
})

describe('buildVehicleSlug', () => {
  it('builds a lowercase, hyphenated slug with a short id fragment', () => {
    expect(buildVehicleSlug('Volkswagen', 'Polo', 2026, '4f8a91b2')).toBe('volkswagen-polo-2026-4f8a91b2')
  })
})
