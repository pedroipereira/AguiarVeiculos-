import { describe, it, expect } from 'vitest'
import { VEHICLE_OPTIONALS, isValidOptional } from '@/lib/vehicle-optionals'

describe('VEHICLE_OPTIONALS', () => {
  it('has no duplicate entries', () => {
    expect(new Set(VEHICLE_OPTIONALS).size).toBe(VEHICLE_OPTIONALS.length)
  })

  it('includes the core items shown in the approved reference', () => {
    expect(VEHICLE_OPTIONALS).toContain('Ar condicionado')
    expect(VEHICLE_OPTIONALS).toContain('Central multimídia')
    expect(VEHICLE_OPTIONALS).toContain('Teto solar')
    expect(VEHICLE_OPTIONALS).toContain('Blindagem')
  })
})

describe('isValidOptional', () => {
  it('accepts a value from the catalog', () => {
    expect(isValidOptional('Ar condicionado')).toBe(true)
  })

  it('rejects a value not in the catalog', () => {
    expect(isValidOptional('Turbina de fibra')).toBe(false)
  })
})
