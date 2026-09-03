import { describe, it, expect } from 'vitest'
import { vehicleFormSchema, financingLeadSchema, tradeInLeadSchema, vehicleExpenseSchema, markVehicleSoldSchema, manualLeadSchema } from '@/lib/validation'

describe('vehicleFormSchema', () => {
  it('accepts a valid vehicle', () => {
    const result = vehicleFormSchema.safeParse({
      brand: 'Fiat', model: 'Argo', version: 'Drive 1.0',
      yearModel: 2023, yearFabrication: 2023, mileageKm: 32000,
      priceCents: 6490000, fuelType: 'Flex', transmission: 'Manual',
      color: 'Prata', description: 'Ótimo estado', plate: 'DEF4G56',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a negative price', () => {
    const result = vehicleFormSchema.safeParse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe('financingLeadSchema', () => {
  it('requires name, vehicle of interest, down payment, and installments', () => {
    expect(financingLeadSchema.safeParse({ name: '' }).success).toBe(false)
    expect(
      financingLeadSchema.safeParse({
        name: 'Maria',
        vehicleLabel: 'Fiat Argo 2023',
        downPayment: 'R$ 5.000',
        installments: '48',
      }).success,
    ).toBe(true)
  })

  it('rejects a missing vehicle of interest, down payment, or installments', () => {
    expect(
      financingLeadSchema.safeParse({ name: 'Maria', vehicleLabel: '', downPayment: 'R$ 5.000', installments: '48' })
        .success,
    ).toBe(false)
    expect(
      financingLeadSchema.safeParse({ name: 'Maria', vehicleLabel: 'Fiat Argo 2023', downPayment: '', installments: '48' })
        .success,
    ).toBe(false)
    expect(
      financingLeadSchema.safeParse({ name: 'Maria', vehicleLabel: 'Fiat Argo 2023', downPayment: 'R$ 5.000' }).success,
    ).toBe(false)
  })

  it('coerces installments to a number', () => {
    const result = financingLeadSchema.safeParse({
      name: 'Maria',
      vehicleLabel: 'Fiat Argo 2023',
      downPayment: 'R$ 5.000',
      installments: '48',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.installments).toBe(48)
  })
})

describe('tradeInLeadSchema', () => {
  it('requires name and vehicle details, with observations optional', () => {
    const result = tradeInLeadSchema.safeParse({
      name: 'João', model: 'Onix', year: 2019, mileageKm: 60000,
    })
    expect(result.success).toBe(true)
  })

  it('accepts observations when provided', () => {
    const result = tradeInLeadSchema.safeParse({
      name: 'João', model: 'Onix', year: 2019, mileageKm: 60000, observations: 'Único dono',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a missing model', () => {
    const result = tradeInLeadSchema.safeParse({ name: 'João', model: '', year: 2019, mileageKm: 60000 })
    expect(result.success).toBe(false)
  })
})

describe('vehicleExpenseSchema', () => {
  it('accepts a fixed category without a description', () => {
    const result = vehicleExpenseSchema.parse({ category: 'pintura', amountCents: 50000 })
    expect(result).toMatchObject({ category: 'pintura', amountCents: 50000 })
  })

  it('requires a description when category is "outros"', () => {
    expect(() => vehicleExpenseSchema.parse({ category: 'outros', amountCents: 20000 })).toThrow()
    expect(() => vehicleExpenseSchema.parse({ category: 'outros', description: '  ', amountCents: 20000 })).toThrow()
  })

  it('accepts "outros" with a non-empty description', () => {
    const result = vehicleExpenseSchema.parse({ category: 'outros', description: 'Alarme', amountCents: 20000 })
    expect(result.description).toBe('Alarme')
  })

  it('rejects an unknown category', () => {
    expect(() => vehicleExpenseSchema.parse({ category: 'turbina', amountCents: 20000 })).toThrow()
  })
})

describe('markVehicleSoldSchema', () => {
  it('accepts a valid sale without a buyer', () => {
    const result = markVehicleSoldSchema.parse({ salePriceCents: 6200000, soldAt: '2026-08-31' })
    expect(result).toMatchObject({ salePriceCents: 6200000, soldAt: '2026-08-31' })
  })

  it('accepts a valid sale with a buyer lead id', () => {
    const result = markVehicleSoldSchema.parse({ salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: '11111111-1111-1111-1111-111111111111' })
    expect(result.buyerLeadId).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('rejects a negative sale price', () => {
    expect(() => markVehicleSoldSchema.parse({ salePriceCents: -1, soldAt: '2026-08-31' })).toThrow()
  })

  it('rejects a missing sale date', () => {
    expect(() => markVehicleSoldSchema.parse({ salePriceCents: 100 })).toThrow()
  })
})

describe('vehicleFormSchema — costs, FIPE, acquisition date, optionals', () => {
  it('accepts a full payload with costs, expenses, FIPE fields, acquired date, and optionals', () => {
    const result = vehicleFormSchema.parse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000,
      acquisitionCostCents: 4000000, minSalePriceCents: 4200000,
      expenses: [{ category: 'pintura', amountCents: 50000 }],
      acquiredAt: '2026-08-01',
      fipeBrandCode: '21', fipeModelCode: '437', fipeYearCode: '1987-1',
      fipeValueCents: 614700, fipeFetchedAt: '2026-08-01T12:00:00.000Z',
      optionals: ['Ar condicionado', 'Teto solar'],
    })
    expect(result.acquisitionCostCents).toBe(4000000)
    expect(result.expenses).toHaveLength(1)
    expect(result.optionals).toEqual(['Ar condicionado', 'Teto solar'])
  })

  it('defaults expenses and optionals to an empty array when omitted', () => {
    const result = vehicleFormSchema.parse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000,
    })
    expect(result.expenses).toEqual([])
    expect(result.optionals).toEqual([])
  })

  it('rejects an optional value outside the fixed catalog', () => {
    expect(() => vehicleFormSchema.parse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, optionals: ['Turbina de fibra'],
    })).toThrow()
  })
})

describe('manualLeadSchema', () => {
  it('accepts a full payload including notes', () => {
    const result = manualLeadSchema.parse({
      name: 'Maria', phone: '98999999999', vehicleId: '11111111-1111-1111-1111-111111111111',
      stage: 'negociando', notes: 'Quer trocar o carro atual', firstContactAt: '2026-09-01',
    })
    expect(result.notes).toBe('Quer trocar o carro atual')
  })

  it('accepts a minimal payload without notes', () => {
    const result = manualLeadSchema.parse({ name: 'João', phone: '98988888888' })
    expect(result.notes).toBeUndefined()
  })

  it('rejects a name shorter than 2 characters', () => {
    expect(manualLeadSchema.safeParse({ name: 'J', phone: '98988888888' }).success).toBe(false)
  })

  it('accepts callbackAt and callbackTime', () => {
    const result = manualLeadSchema.parse({
      name: 'Rita', phone: '98955555555', stage: 'ligar_de_volta',
      callbackAt: '2026-09-20', callbackTime: '09:00',
    })
    expect(result.callbackAt).toBe('2026-09-20')
    expect(result.callbackTime).toBe('09:00')
  })
})
