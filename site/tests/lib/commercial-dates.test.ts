import { describe, it, expect } from 'vitest'
import { resolveCommercialDatesForYear, COMMERCIAL_DATES } from '@/lib/commercial-dates'

describe('resolveCommercialDatesForYear', () => {
  it('resolves a fixed-date rule (Natal, 25/12) the same way every year', () => {
    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === 'Natal')).toEqual({
      date: '2026-12-25', label: 'Natal',
    })
    expect(resolveCommercialDatesForYear(2027).find((d) => d.label === 'Natal')).toEqual({
      date: '2027-12-25', label: 'Natal',
    })
  })

  it('resolves a "nth-weekday" rule (Dia das Mães, 2º domingo de maio) to the correct date each year', () => {
    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === 'Dia das Mães')?.date).toBe('2026-05-10')
    expect(resolveCommercialDatesForYear(2027).find((d) => d.label === 'Dia das Mães')?.date).toBe('2027-05-09')
  })

  it('resolves a "last-weekday" rule (Black Friday, última sexta de novembro) to the correct date each year', () => {
    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === 'Black Friday')?.date).toBe('2026-11-27')
    expect(resolveCommercialDatesForYear(2027).find((d) => d.label === 'Black Friday')?.date).toBe('2027-11-26')
  })

  it('returns exactly one resolved entry per catalog rule', () => {
    expect(resolveCommercialDatesForYear(2026)).toHaveLength(COMMERCIAL_DATES.length)
  })

  it('resolves every entry to an ISO date whose month/day matches the rule', () => {
    for (const entry of resolveCommercialDatesForYear(2026)) {
      expect(entry.date).toMatch(/^2026-\d{2}-\d{2}$/)
    }
  })
})
