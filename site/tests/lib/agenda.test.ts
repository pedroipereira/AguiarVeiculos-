import { describe, it, expect } from 'vitest'
import { getAgendaEventsByDate, buildAgendaMonthGrid, getAgendaStats } from '@/lib/agenda'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'visita_marcada', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, callback_at: null, callback_time: null,
    notes: null, created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('getAgendaEventsByDate', () => {
  it('includes an active lead\'s scheduled visit as a "visita" event', () => {
    const leads = [makeLead({ id: 'a', scheduled_visit_date: '2026-09-10', scheduled_visit_time: '14:00' })]
    const events = getAgendaEventsByDate(leads, '2026-09')
    expect(events['2026-09-10']).toEqual([{ type: 'visita', label: 'Maria', time: '14:00', leadId: 'a' }])
  })

  it('excludes an inactive lead\'s scheduled visit', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', scheduled_visit_date: '2026-09-10' })]
    // Checks the specific date key, not the whole map — September always
    // carries "Dia do Cliente" on the 15th regardless of leads, so
    // asserting the full result equals {} would be wrong for the month.
    expect(getAgendaEventsByDate(leads, '2026-09')['2026-09-10']).toBeUndefined()
  })

  it('includes a callback as "retorno" only while the lead is in ligar_de_volta', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'ligar_de_volta', callback_at: '2026-09-12', callback_time: '10:00' }),
      makeLead({ id: 'b', stage: 'negociando', callback_at: '2026-09-13' }),
    ]
    const events = getAgendaEventsByDate(leads, '2026-09')
    expect(events['2026-09-12']).toEqual([{ type: 'retorno', label: 'Maria', time: '10:00', leadId: 'a' }])
    expect(events['2026-09-13']).toBeUndefined()
  })

  it('includes commercial dates falling in the requested month', () => {
    const events = getAgendaEventsByDate([], '2026-09')
    expect(events['2026-09-15']).toEqual([{ type: 'comercial', label: 'Dia do Cliente' }])
  })

  it('excludes events from other months', () => {
    const leads = [makeLead({ id: 'a', scheduled_visit_date: '2026-10-10' })]
    // Same reasoning as above — check for the lead specifically, since
    // September's own commercial date would otherwise make a {} check pass
    // or fail for the wrong reason.
    const events = Object.values(getAgendaEventsByDate(leads, '2026-09')).flat()
    expect(events.some((event) => event.leadId === 'a')).toBe(false)
  })

  it('orders same-day events by time, with no-time events last, then by type', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'ligar_de_volta', callback_at: '2026-09-15' }),
      makeLead({ id: 'b', scheduled_visit_date: '2026-09-15', scheduled_visit_time: '08:00' }),
    ]
    // 'b' (visita) has a time, so it sorts first; 'a' (retorno) and the
    // commercial date (Dia do Cliente, 2026-09-15) both have no time, so
    // they fall back to type order: retorno (1) before comercial (2).
    const events = getAgendaEventsByDate(leads, '2026-09')['2026-09-15']
    expect(events.map((event) => event.type)).toEqual(['visita', 'retorno', 'comercial'])
  })

  it('returns an empty object for a month with no leads and no matching commercial dates', () => {
    expect(getAgendaEventsByDate([], '2026-04')).toEqual({})
  })
})

describe('buildAgendaMonthGrid', () => {
  it('pads the first week with nulls up to the weekday of the 1st (Tuesday, September 2026)', () => {
    const grid = buildAgendaMonthGrid(2026, 8)
    expect(grid[0]).toEqual([null, null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'])
  })

  it('starts the grid with no leading nulls when the 1st is a Sunday (February 2026)', () => {
    const grid = buildAgendaMonthGrid(2026, 1)
    expect(grid[0][0]).toBe('2026-02-01')
  })

  it('pads with exactly one leading null when the 1st is a Monday (June 2026)', () => {
    const grid = buildAgendaMonthGrid(2026, 5)
    expect(grid[0][1]).toBe('2026-06-01')
  })

  it('produces exactly 4 rows for a 28-day month starting on Sunday (February 2026)', () => {
    const grid = buildAgendaMonthGrid(2026, 1)
    expect(grid).toHaveLength(4)
    expect(grid[3]).toEqual(['2026-02-22', '2026-02-23', '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28'])
  })

  it('produces exactly 5 rows for September 2026, with trailing nulls in the last row', () => {
    const grid = buildAgendaMonthGrid(2026, 8)
    expect(grid).toHaveLength(5)
    expect(grid[4]).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', null, null, null])
  })

  it('produces exactly 6 rows for a 31-day month starting on Friday (May 2026)', () => {
    const grid = buildAgendaMonthGrid(2026, 4)
    expect(grid).toHaveLength(6)
  })
})

describe('getAgendaStats', () => {
  const NOW = new Date(2026, 8, 25) // Friday, September 25th 2026

  it('counts visits scheduled for today, excluding other days', () => {
    const leads = [
      makeLead({ id: 'a', scheduled_visit_date: '2026-09-25' }),
      makeLead({ id: 'b', scheduled_visit_date: '2026-09-26' }),
    ]
    expect(getAgendaStats(leads, NOW).visitsToday).toBe(1)
  })

  it('counts callbacks due today, only for leads still in ligar_de_volta', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'ligar_de_volta', callback_at: '2026-09-25' }),
      makeLead({ id: 'b', stage: 'negociando', callback_at: '2026-09-25' }),
    ]
    expect(getAgendaStats(leads, NOW).callbacksToday).toBe(1)
  })

  it('counts visits and callbacks within the next 7 days, inclusive of today', () => {
    const leads = [
      makeLead({ id: 'a', scheduled_visit_date: '2026-09-25' }), // today, +0
      makeLead({ id: 'b', scheduled_visit_date: '2026-10-01' }), // +6, still in range
      makeLead({ id: 'c', scheduled_visit_date: '2026-10-02' }), // +7, out of range
      makeLead({ id: 'd', stage: 'ligar_de_volta', callback_at: '2026-09-27' }), // +2
    ]
    expect(getAgendaStats(leads, NOW).next7Days).toBe(3)
  })

  it('counts overdue callbacks as a past callback_at OR no callback_at at all, only while still in ligar_de_volta', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'ligar_de_volta', callback_at: '2026-09-20' }), // past
      makeLead({ id: 'b', stage: 'ligar_de_volta', callback_at: null }), // no date set
      makeLead({ id: 'c', stage: 'ligar_de_volta', callback_at: '2026-09-25' }), // due today, not overdue
      makeLead({ id: 'd', stage: 'ligar_de_volta', callback_at: '2026-09-30' }), // future
      makeLead({ id: 'e', stage: 'negociando', callback_at: '2026-09-01' }), // moved on, no longer counts
    ]
    expect(getAgendaStats(leads, NOW).overdueCallbacks).toBe(2)
  })

  it('excludes inactive leads from every stat', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'vendeu', scheduled_visit_date: '2026-09-25' }),
      makeLead({ id: 'b', stage: 'nao_comprou', scheduled_visit_date: '2026-09-25' }),
    ]
    expect(getAgendaStats(leads, NOW)).toEqual({ visitsToday: 0, callbacksToday: 0, next7Days: 0, overdueCallbacks: 0 })
  })

  it('returns all zeros for an empty lead list', () => {
    expect(getAgendaStats([], NOW)).toEqual({ visitsToday: 0, callbacksToday: 0, next7Days: 0, overdueCallbacks: 0 })
  })
})
