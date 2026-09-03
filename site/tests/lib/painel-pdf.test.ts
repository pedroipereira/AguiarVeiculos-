import { buildPainelPdf } from '@/lib/painel-pdf'
import type { Vehicle, Lead } from '@/lib/types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2024, year_fabrication: 2024, mileage_km: 10000, price_cents: 8000000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null,
    horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null,
    fipe_value_cents: null, fipe_fetched_at: null, optionals: [],
    ...overrides,
  }
}

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Cliente', phone: '99999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, callback_at: null, callback_time: null, notes: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const NOW = new Date(2026, 8, 25)

describe('buildPainelPdf', () => {
  it('builds a document covering every section without throwing, given a full data set', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000, acquisition_cost_cents: 3000000 }),
      makeVehicle({ id: 'b', status: 'available', acquired_at: '2026-01-01', acquisition_cost_cents: 4000000 }),
      makeVehicle({ id: 'c', status: 'preparing', price_cents: 6000000 }),
    ]
    const leads = [
      makeLead({ id: '1', stage: 'novo' }),
      makeLead({ id: '2', stage: 'negociando' }),
      makeLead({ id: '3', stage: 'vendeu' }),
    ]

    const doc = buildPainelPdf({
      goal: 20,
      soldCount: 12,
      periodLabel: 'Mês',
      metrics: { count: 1, revenueCents: 5000000, profitCents: 2000000, marginPercent: 40, averageSaleCents: 5000000 },
      vehicles,
      expenseTotals: { a: 100000 },
      leads,
      thresholdDays: 90,
      now: NOW,
    })

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })

  it('builds a document without throwing when there is no data at all', () => {
    const doc = buildPainelPdf({
      goal: null,
      soldCount: 0,
      periodLabel: 'Mês',
      metrics: { count: 0, revenueCents: 0, profitCents: 0, marginPercent: 0, averageSaleCents: 0 },
      vehicles: [],
      expenseTotals: {},
      leads: [],
      thresholdDays: 90,
      now: NOW,
    })

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })

  it('does not throw when every section has several rows (exercises the page-break logic)', () => {
    const vehicles = Array.from({ length: 6 }, (_, index) =>
      makeVehicle({ id: `v-${index}`, status: 'available', acquired_at: '2020-01-01', price_cents: 5000000 + index }),
    )
    const leads = Array.from({ length: 10 }, (_, index) => makeLead({ id: `l-${index}`, stage: 'novo' }))

    const doc = buildPainelPdf({
      goal: 20,
      soldCount: 5,
      periodLabel: 'Ano',
      metrics: { count: 5, revenueCents: 25000000, profitCents: 5000000, marginPercent: 20, averageSaleCents: 5000000 },
      vehicles,
      expenseTotals: {},
      leads,
      thresholdDays: 90,
      now: NOW,
    })

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })
})
