import { describe, it, expect } from 'vitest'
import { buildWhatsAppUrl, buildVehicleInterestMessage, buildFinancingMessage, buildTradeInMessage, WHATSAPP_NUMBER } from '@/lib/whatsapp'

describe('buildWhatsAppUrl', () => {
  it('encodes the message and targets the store number', () => {
    const url = buildWhatsAppUrl('Olá!')
    expect(url).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!`)
  })
})

describe('buildVehicleInterestMessage', () => {
  it('mentions the vehicle', () => {
    const msg = buildVehicleInterestMessage({ brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', year_model: 2023 })
    expect(msg).toContain('Fiat Argo Drive 1.0 2023')
    expect(msg).toContain('Tenho interesse')
  })
})

describe('buildFinancingMessage', () => {
  it('includes the name and vehicle label', () => {
    const msg = buildFinancingMessage({ name: 'Maria', vehicleLabel: 'Fiat Argo 2023' })
    expect(msg).toContain('Maria')
    expect(msg).toContain('Fiat Argo 2023')
    expect(msg).toContain('financiamento')
  })
})

describe('buildTradeInMessage', () => {
  it('includes the trade-in vehicle details', () => {
    const msg = buildTradeInMessage({ name: 'João', brand: 'Chevrolet', model: 'Onix', year: 2019, mileageKm: 60000 })
    expect(msg).toContain('João')
    expect(msg).toContain('Chevrolet Onix 2019')
    expect(msg).toContain('60000')
  })
})
