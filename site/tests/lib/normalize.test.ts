import { describe, it, expect } from 'vitest'
import {
  normalizeTransmission, normalizeFuelType, normalizeColor, withCurrentValue, capitalizeWords, normalizePlate,
} from '@/lib/normalize'

describe('normalizeTransmission', () => {
  it('collapses case and accent variants to the canonical value', () => {
    expect(normalizeTransmission('automatico')).toBe('Automático')
    expect(normalizeTransmission('AUTOMÁTICO')).toBe('Automático')
    expect(normalizeTransmission('  Automático  ')).toBe('Automático')
    expect(normalizeTransmission('manual')).toBe('Manual')
  })

  it('keeps an unrecognized value, but still capitalizes it, instead of rejecting it', () => {
    expect(normalizeTransmission('semi-automático')).toBe('Semi-automático')
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

describe('capitalizeWords', () => {
  it('capitalizes the first letter of each word, lowercasing the rest', () => {
    expect(capitalizeWords('hb20 comfort')).toBe('Hb20 Comfort')
    expect(capitalizeWords('FIAT')).toBe('Fiat')
    expect(capitalizeWords('  volkswagen  ')).toBe('Volkswagen')
  })
})

describe('normalizePlate', () => {
  it('uppercases and trims the plate', () => {
    expect(normalizePlate('abc1d23')).toBe('ABC1D23')
    expect(normalizePlate('  Abc1D23  ')).toBe('ABC1D23')
  })

  it('returns null for empty or missing input', () => {
    expect(normalizePlate('')).toBeNull()
    expect(normalizePlate(null)).toBeNull()
    expect(normalizePlate(undefined)).toBeNull()
  })
})

describe('withCurrentValue', () => {
  it('returns the options unchanged when the current value is already in the list', () => {
    expect(withCurrentValue(['Manual', 'Automático'], 'Manual')).toEqual(['Manual', 'Automático'])
  })

  it('prepends the current value when it is not in the list, so an old row never loses its value', () => {
    expect(withCurrentValue(['Manual', 'Automático'], 'Semi-automático')).toEqual(['Semi-automático', 'Manual', 'Automático'])
  })

  it('returns the options unchanged when there is no current value', () => {
    expect(withCurrentValue(['Manual', 'Automático'], null)).toEqual(['Manual', 'Automático'])
    expect(withCurrentValue(['Manual', 'Automático'], undefined)).toEqual(['Manual', 'Automático'])
  })
})
