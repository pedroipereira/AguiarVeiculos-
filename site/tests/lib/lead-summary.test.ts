import { describe, it, expect } from 'vitest'
import { isOverdueReturn, getLeadSummaryCounts, getBuyers, getCurrentMonthValue } from '@/lib/lead-summary'
import type { Lead, Vehicle } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'fiat-argo', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2023, year_fabrication: 2023, mileage_km: 30000, price_cents: 6490000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null, horsepower: null,
    is_featured: false, status: 'sold', created_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: 6200000, sold_at: '2026-09-02', buyer_lead_id: 'l-1',
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null, fipe_value_cents: null, fipe_fetched_at: null,
    optionals: [],
    ...overrides,
  }
}

describe('isOverdueReturn', () => {
  const NOW = new Date(2026, 8, 2, 12, 0) // Sept 2, 2026, 12:00 local

  it('is true when the scheduled visit date/time already passed', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-01', scheduled_visit_time: '10:00' })
    expect(isOverdueReturn(lead, NOW)).toBe(true)
  })

  it('is false when the scheduled visit is still in the future', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-03', scheduled_visit_time: '10:00' })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })

  it('treats a missing time as end of day (23:59) — today with no time is not yet overdue', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-02', scheduled_visit_time: null })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })

  it('with a missing time, a past day is overdue', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-01', scheduled_visit_time: null })
    expect(isOverdueReturn(lead, NOW)).toBe(true)
  })

  it('is false for any stage other than visita_marcada, even with a past date', () => {
    const lead = makeLead({ stage: 'negociando', scheduled_visit_date: '2026-09-01', scheduled_visit_time: '10:00' })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })

  it('is false when there is no scheduled_visit_date at all', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: null })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })
})

describe('getLeadSummaryCounts', () => {
  const NOW = new Date(2026, 8, 2, 12, 0)

  it('counts active, negotiating, overdue, and sold-in-month independently', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'novo' }),
      makeLead({ id: 'b', stage: 'negociando' }),
      makeLead({ id: 'c', stage: 'visita_marcada', scheduled_visit_date: '2026-09-01', scheduled_visit_time: '10:00' }),
      makeLead({ id: 'd', stage: 'vendeu' }),
      makeLead({ id: 'e', stage: 'nao_comprou' }),
    ]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' }), makeVehicle({ id: 'v-2', sold_at: '2026-08-15' })]

    expect(getLeadSummaryCounts(leads, vehicles, '2026-09', NOW)).toEqual({
      active: 3, // a, b, c (not d=vendeu or e=nao_comprou)
      negotiating: 1, // b
      overdue: 1, // c
      soldInMonth: 1, // only v-1 sold in September
    })
  })

  it('soldInMonth is the only count affected by a different month', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' })]
    const vehicles = [makeVehicle({ sold_at: '2026-08-15' })]

    expect(getLeadSummaryCounts(leads, vehicles, '2026-08', NOW).soldInMonth).toBe(1)
    expect(getLeadSummaryCounts(leads, vehicles, '2026-01', NOW).soldInMonth).toBe(0)
    expect(getLeadSummaryCounts(leads, vehicles, '2026-01', NOW).active).toBe(1)
  })

  it('treats an empty or malformed month as matching nothing, not everything', () => {
    const vehicles = [makeVehicle({ sold_at: '2026-09-02' })]
    expect(getLeadSummaryCounts([], vehicles, '', NOW).soldInMonth).toBe(0)
    expect(getLeadSummaryCounts([], vehicles, 'garbage', NOW).soldInMonth).toBe(0)
    expect(getLeadSummaryCounts([], vehicles, '2026-9', NOW).soldInMonth).toBe(0) // not zero-padded
  })
})

describe('getBuyers', () => {
  it('matches a "vendeu" lead to its vehicle when the sale falls in the given month', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([{ lead: leads[0], vehicle: vehicles[0] }])
  })

  it('excludes a sale outside the given month', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-08-15' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([])
  })

  it('excludes a lead not at the "vendeu" stage', () => {
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([])
  })

  it('excludes a "vendeu" lead with no linked vehicle', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: null })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([])
  })

  it('getBuyers treats an empty or malformed month as matching nothing', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' })]
    expect(getBuyers(leads, vehicles, '')).toEqual([])
    expect(getBuyers(leads, vehicles, 'garbage')).toEqual([])
  })

  it('matches a buyer via vehicle.buyer_lead_id, even when the lead never reached "vendeu" through the kanban', () => {
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: null })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02', buyer_lead_id: 'a' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([{ lead: leads[0], vehicle: vehicles[0] }])
  })

  it('prefers vehicle.buyer_lead_id over a stale lead.vehicle_id link when both exist', () => {
    const buyerLead = makeLead({ id: 'buyer', stage: 'negociando' })
    const otherLead = makeLead({ id: 'other', stage: 'vendeu', vehicle_id: 'v-1' })
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02', buyer_lead_id: 'buyer' })]
    expect(getBuyers([buyerLead, otherLead], vehicles, '2026-09')).toEqual([{ lead: buyerLead, vehicle: vehicles[0] }])
  })
})

describe('getCurrentMonthValue', () => {
  it('formats as YYYY-MM, zero-padded', () => {
    expect(getCurrentMonthValue(new Date(2026, 0, 15))).toBe('2026-01')
    expect(getCurrentMonthValue(new Date(2026, 8, 15))).toBe('2026-09')
  })
})
