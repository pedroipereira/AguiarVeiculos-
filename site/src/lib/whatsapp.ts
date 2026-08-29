import type { VehiclePublic } from './types'

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5598991030107'

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function buildVehicleInterestMessage(
  vehicle: Pick<VehiclePublic, 'brand' | 'model' | 'version' | 'year_model'>,
): string {
  const label = [vehicle.brand, vehicle.model, vehicle.version, vehicle.year_model].filter(Boolean).join(' ')
  return `Olá! Tenho interesse no ${label} que vi no site da Aguiar Veículos. Pode me passar mais informações?`
}

export function buildFinancingMessage(data: { name: string; downPayment?: string; vehicleLabel?: string }): string {
  const parts = [
    `Olá! Meu nome é ${data.name} e quero simular um financiamento na Aguiar Veículos.`,
  ]
  if (data.vehicleLabel) parts.push(`Carro de interesse: ${data.vehicleLabel}.`)
  if (data.downPayment) parts.push(`Entrada disponível: ${data.downPayment}.`)
  return parts.join(' ')
}

export function buildTradeInMessage(data: { name: string; brand: string; model: string; year: number; mileageKm: number }): string {
  return `Olá! Meu nome é ${data.name} e quero avaliar meu ${data.brand} ${data.model} ${data.year} (${data.mileageKm} km rodados) para troca na Aguiar Veículos.`
}
