import { describe, it, expect } from 'vitest'
import { vehicleFormSchema, financingLeadSchema, tradeInLeadSchema } from '@/lib/validation'

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
