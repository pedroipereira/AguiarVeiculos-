import type { VehiclePublic } from './types'
import { formatPriceFromCents } from './format'

export const SITE_URL = 'https://aguiarveiculos.com'
export const SITE_NAME = 'Aguiar Veículos'

type VehicleTitleFields = Pick<VehiclePublic, 'brand' | 'model' | 'version' | 'year_model'>
type VehicleDescriptionFields = VehicleTitleFields & Pick<VehiclePublic, 'mileage_km' | 'price_cents' | 'color'>

/** "Fiat Argo Drive 1.0 2023" — the shared label used in both the page title and JSON-LD. */
export function buildVehicleTitle(vehicle: VehicleTitleFields): string {
  return [vehicle.brand, vehicle.model, vehicle.version, String(vehicle.year_model)].filter(Boolean).join(' ')
}

export function buildVehicleDescription(vehicle: VehicleDescriptionFields): string {
  const label = buildVehicleTitle(vehicle)
  const km = `${vehicle.mileage_km.toLocaleString('pt-BR')} km`
  const colorClause = vehicle.color ? `, cor ${vehicle.color}` : ''
  const price = formatPriceFromCents(vehicle.price_cents)
  return `${label}, ${km}${colorClause}, por ${price} na Aguiar Veículos em Presidente Dutra - MA.`
}

/**
 * Sitewide business schema (schema.org AutomotiveBusiness) — contact details
 * copied from contexto/empresa.md; update both places together if they change.
 */
export function buildBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    name: SITE_NAME,
    url: SITE_URL,
    telephone: '+5598991030107',
    email: 'aguiarveiculospdutra@hotmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Campo Dantas, 1689',
      addressLocality: 'Presidente Dutra',
      addressRegion: 'MA',
      addressCountry: 'BR',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:30',
        closes: '17:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:00',
        closes: '13:00',
      },
    ],
  }
}

/** Per-vehicle schema.org Vehicle + Offer, for the detail page. */
export function buildVehicleJsonLd(vehicle: VehiclePublic, imageUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: buildVehicleTitle(vehicle),
    brand: vehicle.brand,
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year_model),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: vehicle.mileage_km, unitCode: 'KMT' },
    ...(imageUrl ? { image: imageUrl } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: (vehicle.price_cents / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/estoque/${vehicle.slug}`,
    },
  }
}
