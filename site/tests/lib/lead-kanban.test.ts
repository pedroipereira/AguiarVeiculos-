import { describe, it, expect } from 'vitest'
import {
  LEAD_STAGES, LEAD_STAGE_LABELS, groupLeadsByStage, requiresSaleCompletion, buildWhatsAppLink, formatIsoDate,
} from '@/lib/lead-kanban'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('LEAD_STAGES / LEAD_STAGE_LABELS', () => {
  it('has one label per stage, in the funnel order', () => {
    expect(LEAD_STAGES).toEqual(['novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou'])
    expect(Object.keys(LEAD_STAGE_LABELS)).toHaveLength(LEAD_STAGES.length)
  })
})

describe('groupLeadsByStage', () => {
  it('buckets leads into all 6 stages, with empty arrays for stages with no leads', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' }), makeLead({ id: 'b', stage: 'vendeu' })]
    const groups = groupLeadsByStage(leads)
    expect(groups.novo.map((l) => l.id)).toEqual(['a'])
    expect(groups.vendeu.map((l) => l.id)).toEqual(['b'])
    expect(groups.negociando).toEqual([])
  })

  it('preserves the input order within each column', () => {
    const leads = [
      makeLead({ id: 'first', stage: 'novo', created_at: '2026-09-01T10:00:00.000Z' }),
      makeLead({ id: 'second', stage: 'novo', created_at: '2026-08-30T10:00:00.000Z' }),
    ]
    expect(groupLeadsByStage(leads).novo.map((l) => l.id)).toEqual(['first', 'second'])
  })
})

describe('requiresSaleCompletion', () => {
  it('is true when moving to "vendeu" a lead with a linked vehicle', () => {
    expect(requiresSaleCompletion({ vehicle_id: 'v-1' }, 'vendeu')).toBe(true)
  })

  it('is false when moving to "vendeu" a lead with no linked vehicle', () => {
    expect(requiresSaleCompletion({ vehicle_id: null }, 'vendeu')).toBe(false)
  })

  it('is false when moving to any other stage, even with a linked vehicle', () => {
    expect(requiresSaleCompletion({ vehicle_id: 'v-1' }, 'negociando')).toBe(false)
  })
})

describe('buildWhatsAppLink', () => {
  it('strips formatting and prefixes the Brazil country code', () => {
    expect(buildWhatsAppLink('(98) 99999-9999')).toBe('https://wa.me/5598999999999')
  })

  it('leaves already-bare digits untouched aside from the prefix', () => {
    expect(buildWhatsAppLink('98999999999')).toBe('https://wa.me/5598999999999')
  })
})

describe('formatIsoDate', () => {
  it('reformats an ISO date to dd/mm/yyyy without going through Date (no timezone shift)', () => {
    expect(formatIsoDate('2026-09-01')).toBe('01/09/2026')
  })
})
