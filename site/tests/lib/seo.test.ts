import { describe, it, expect } from 'vitest'
import { SITE_URL, SITE_NAME, buildVehicleTitle, buildVehicleDescription, buildBusinessJsonLd, buildVehicleJsonLd } from '@/lib/seo'
import type { VehiclePublic } from '@/lib/types'

function makeVehicle(overrides: Partial<VehiclePublic> = {}): VehiclePublic {
  return {
    id: '1', slug: 'fiat-argo-2023-abc', brand: 'Fiat', model: 'Argo', version: 'Drive 1.0',
    year_model: 2023, year_fabrication: 2023, mileage_km: 32000, price_cents: 6490000,
    fuel_type: 'Flex', transmission: 'Manual', color: 'Prata', description: null,
    engine: null, fuel_tank_liters: null, seating_capacity: null, body_type: null,
    doors: null, horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    optionals: [],
    ...overrides,
  }
}

describe('buildVehicleTitle', () => {
  it('joins brand, model, version, and year', () => {
    expect(buildVehicleTitle(makeVehicle())).toBe('Fiat Argo Drive 1.0 2023')
  })

  it('omits a missing version without a stray space', () => {
    expect(buildVehicleTitle(makeVehicle({ version: null }))).toBe('Fiat Argo 2023')
  })
})

describe('buildVehicleDescription', () => {
  it('includes label, mileage, color, and price', () => {
    const description = buildVehicleDescription(makeVehicle())
    expect(description).toContain('Fiat Argo Drive 1.0 2023')
    expect(description).toContain('32.000 km')
    expect(description).toContain('cor Prata')
    expect(description).toContain('R$ 64.900')
    expect(description).toContain('Presidente Dutra')
  })

  it('omits the color clause when the vehicle has none set', () => {
    const description = buildVehicleDescription(makeVehicle({ color: null }))
    expect(description).not.toContain('cor')
  })
})

describe('buildBusinessJsonLd', () => {
  it('describes the dealership with contact and address details', () => {
    const jsonLd = buildBusinessJsonLd() as any
    expect(jsonLd['@type']).toBe('AutomotiveBusiness')
    expect(jsonLd.name).toBe(SITE_NAME)
    expect(jsonLd.url).toBe(SITE_URL)
    expect(jsonLd.address.addressLocality).toBe('Presidente Dutra')
    expect(jsonLd.address.addressRegion).toBe('MA')
    expect(jsonLd.telephone).toBe('+5598991030107')
  })

  it('lists weekday and Saturday hours separately', () => {
    const jsonLd = buildBusinessJsonLd() as any
    expect(jsonLd.openingHoursSpecification).toHaveLength(2)
    expect(jsonLd.openingHoursSpecification[0].dayOfWeek).toEqual([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    ])
    expect(jsonLd.openingHoursSpecification[0].opens).toBe('07:30')
    expect(jsonLd.openingHoursSpecification[1].dayOfWeek).toEqual(['Saturday'])
    expect(jsonLd.openingHoursSpecification[1].closes).toBe('13:00')
  })
})

describe('buildVehicleJsonLd', () => {
  it('describes the vehicle and its offer', () => {
    const jsonLd = buildVehicleJsonLd(makeVehicle(), 'https://cdn.test/argo.jpg') as any
    expect(jsonLd['@type']).toBe('Vehicle')
    expect(jsonLd.brand).toBe('Fiat')
    expect(jsonLd.model).toBe('Argo')
    expect(jsonLd.vehicleModelDate).toBe('2023')
    expect(jsonLd.mileageFromOdometer).toEqual({ '@type': 'QuantitativeValue', value: 32000, unitCode: 'KMT' })
    expect(jsonLd.image).toBe('https://cdn.test/argo.jpg')
    expect(jsonLd.offers).toEqual({
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: '64900.00',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/estoque/fiat-argo-2023-abc`,
    })
  })

  it('omits the image field when no photo is available', () => {
    const jsonLd = buildVehicleJsonLd(makeVehicle()) as any
    expect(jsonLd.image).toBeUndefined()
  })
})
