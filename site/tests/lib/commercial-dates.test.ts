import { describe, it, expect } from 'vitest'
import { resolveCommercialDatesForYear, COMMERCIAL_DATES } from '@/lib/commercial-dates'
import type { CommercialDateRule } from '@/lib/commercial-dates'

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
    for (const rule of COMMERCIAL_DATES) {
      const [resolved] = resolveCommercialDatesForYear(2026, [rule])
      const [, month, day] = resolved.date.split('-').map(Number)
      if (rule.type === 'fixed') {
        expect(month).toBe(rule.month)
        expect(day).toBe(rule.day)
      } else if (rule.type === 'nth-weekday' || rule.type === 'last-weekday') {
        expect(month).toBe(rule.month)
      }
      // 'easter-relative' has no fixed month/day to compare — covered by
      // its own test below, against independently known Easter-derived dates.
    }
  })

  it('resolves "easter-relative" rules (Carnaval, Sexta-feira Santa, Corpus Christi) against known Easter Sundays', () => {
    // Easter Sunday: 2026-04-05, 2027-03-28 (independently known dates).
    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === 'Carnaval')?.date).toBe('2026-02-17')
    expect(resolveCommercialDatesForYear(2027).find((d) => d.label === 'Carnaval')?.date).toBe('2027-02-09')

    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === 'Sexta-feira Santa')?.date).toBe('2026-04-03')
    expect(resolveCommercialDatesForYear(2027).find((d) => d.label === 'Sexta-feira Santa')?.date).toBe('2027-03-26')

    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === 'Corpus Christi')?.date).toBe('2026-06-04')
    expect(resolveCommercialDatesForYear(2027).find((d) => d.label === 'Corpus Christi')?.date).toBe('2027-05-27')
  })

  it('includes the store\'s anniversary (18/06) and Presidente Dutra\'s anniversary (28/06)', () => {
    const dates2026 = resolveCommercialDatesForYear(2026)
    expect(dates2026.find((d) => d.label === 'Aniversário da loja')?.date).toBe('2026-06-18')
    expect(dates2026.find((d) => d.label === 'Aniversário de Presidente Dutra')?.date).toBe('2026-06-28')
  })

  it('includes the fixed-date national holidays', () => {
    const dates2026 = resolveCommercialDatesForYear(2026)
    expect(dates2026.find((d) => d.label === 'Tiradentes')?.date).toBe('2026-04-21')
    expect(dates2026.find((d) => d.label === 'Dia do Trabalho')?.date).toBe('2026-05-01')
    expect(dates2026.find((d) => d.label === 'Independência do Brasil')?.date).toBe('2026-09-07')
    expect(dates2026.find((d) => d.label === 'Nossa Senhora Aparecida')?.date).toBe('2026-10-12')
    expect(dates2026.find((d) => d.label === 'Finados')?.date).toBe('2026-11-02')
    expect(dates2026.find((d) => d.label === 'Proclamação da República')?.date).toBe('2026-11-15')
    expect(dates2026.find((d) => d.label === 'Consciência Negra')?.date).toBe('2026-11-20')
  })

  it('includes Ano Novo (01/01) and the 2ª parcela do 13º salário (20/12)', () => {
    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === 'Ano Novo')).toEqual({
      date: '2026-01-01', label: 'Ano Novo',
    })
    expect(resolveCommercialDatesForYear(2026).find((d) => d.label === '2ª parcela do 13º salário')).toEqual({
      date: '2026-12-20', label: '2ª parcela do 13º salário',
    })
  })

  it('filters out an nth-weekday rule whose occurrence does not exist in a given month/year', () => {
    const rules: CommercialDateRule[] = [{ type: 'nth-weekday', month: 2, weekday: 0, occurrence: 5, label: 'Impossível' }]
    expect(resolveCommercialDatesForYear(2026, rules)).toEqual([])
  })
})
