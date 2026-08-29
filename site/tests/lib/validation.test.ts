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
  it('requires name and phone', () => {
    expect(financingLeadSchema.safeParse({ name: '', phone: '' }).success).toBe(false)
    expect(financingLeadSchema.safeParse({ name: 'Maria', phone: '98999999999' }).success).toBe(true)
  })
})

describe('tradeInLeadSchema', () => {
  it('requires vehicle details plus name and phone', () => {
    const result = tradeInLeadSchema.safeParse({
      name: 'João', phone: '98988888888', brand: 'Chevrolet', model: 'Onix', year: 2019, mileageKm: 60000,
    })
    expect(result.success).toBe(true)
  })
})
