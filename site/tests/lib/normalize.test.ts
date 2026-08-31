import { describe, it, expect } from 'vitest'
import { normalizeTransmission, normalizeFuelType, normalizeColor } from '@/lib/normalize'

describe('normalizeTransmission', () => {
  it('collapses case and accent variants to the canonical value', () => {
    expect(normalizeTransmission('automatico')).toBe('Automático')
    expect(normalizeTransmission('AUTOMÁTICO')).toBe('Automático')
    expect(normalizeTransmission('  Automático  ')).toBe('Automático')
    expect(normalizeTransmission('manual')).toBe('Manual')
  })

  it('keeps an unrecognized value as-is instead of rejecting it', () => {
    expect(normalizeTransmission('Semi-automático')).toBe('Semi-automático')
  })

  it('returns null for empty or missing input', () => {
    expect(normalizeTransmission('')).toBeNull()
    expect(normalizeTransmission('   ')).toBeNull()
    expect(normalizeTransmission(null)).toBeNull()
    expect(normalizeTransmission(undefined)).toBeNull()
  })
})

describe('normalizeFuelType', () => {
  it('collapses case and accent variants to the canonical value', () => {
    expect(normalizeFuelType('flex')).toBe('Flex')
    expect(normalizeFuelType('eletrico')).toBe('Elétrico')
    expect(normalizeFuelType('HÍBRIDO')).toBe('Híbrido')
  })
})

describe('normalizeColor', () => {
  it('collapses case and accent variants to the canonical value', () => {
    expect(normalizeColor('branco')).toBe('Branco')
    expect(normalizeColor('VERMELHO')).toBe('Vermelho')
  })
})
