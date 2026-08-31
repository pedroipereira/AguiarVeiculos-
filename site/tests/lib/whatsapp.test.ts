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
  it('includes the name, vehicle of interest, down payment, and installments', () => {
    const msg = buildFinancingMessage({
      name: 'Maria',
      vehicleLabel: 'Fiat Argo 2023',
      downPayment: 'R$ 5.000',
      installments: 48,
    })
    expect(msg).toContain('Maria')
    expect(msg).toContain('Fiat Argo 2023')
    expect(msg).toContain('R$ 5.000')
    expect(msg).toContain('48')
    expect(msg).toContain('financiamento')
  })

  it('reads as a single flowing sentence, not a list of labeled fields', () => {
    const msg = buildFinancingMessage({
      name: 'Maria',
      vehicleLabel: 'Fiat',
      downPayment: '5000',
      installments: 48,
    })
    expect(msg).toBe(
      'Olá! Meu nome é Maria e queria simular um financiamento. Tenho interesse no carro Fiat e possuo uma entrada de 5000 sendo 48 parcelas.',
    )
  })
})

describe('buildTradeInMessage', () => {
  it('includes the trade-in vehicle details', () => {
    const msg = buildTradeInMessage({ name: 'João', model: 'Onix', year: 2019, mileageKm: 60000 })
    expect(msg).toContain('João')
    expect(msg).toContain('Onix 2019')
    expect(msg).toContain('60000')
  })

  it('appends observations when provided', () => {
    const msg = buildTradeInMessage({ name: 'João', model: 'Onix', year: 2019, mileageKm: 60000, observations: 'Único dono' })
    expect(msg).toContain('Observações: Único dono')
  })

  it('omits the observations sentence when none are given', () => {
    const msg = buildTradeInMessage({ name: 'João', model: 'Onix', year: 2019, mileageKm: 60000 })
    expect(msg).not.toContain('Observações')
  })

  it('offers the vehicle as a down payment, not a straight trade', () => {
    const msg = buildTradeInMessage({ name: 'João', model: 'Onix', year: 2019, mileageKm: 60000 })
    expect(msg).toContain('para dar de entrada')
    expect(msg).not.toContain('para troca')
  })
})
