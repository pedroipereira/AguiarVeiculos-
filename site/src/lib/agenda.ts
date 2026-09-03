import type { Lead } from './types'
import { resolveCommercialDatesForYear } from './commercial-dates'

export type AgendaEventType = 'visita' | 'retorno' | 'comercial'

export interface AgendaEvent {
  type: AgendaEventType
  label: string
  time?: string
  leadId?: string
}

const TYPE_ORDER: Record<AgendaEventType, number> = { visita: 0, retorno: 1, comercial: 2 }

function isActiveLead(lead: Pick<Lead, 'stage'>): boolean {
  return lead.stage !== 'vendeu' && lead.stage !== 'nao_comprou'
}

function pushEvent(map: Record<string, AgendaEvent[]>, date: string, event: AgendaEvent): void {
  if (!map[date]) map[date] = []
  map[date].push(event)
}

export function getAgendaEventsByDate(leads: Lead[], month: string): Record<string, AgendaEvent[]> {
  const map: Record<string, AgendaEvent[]> = {}

  for (const lead of leads) {
    if (!isActiveLead(lead)) continue

    if (lead.scheduled_visit_date?.startsWith(month)) {
      pushEvent(map, lead.scheduled_visit_date, {
        type: 'visita',
        label: lead.name,
        time: lead.scheduled_visit_time ?? undefined,
        leadId: lead.id,
      })
    }

    // callback_at is never cleared when a lead leaves "ligar de volta", so
    // gating on the current stage (not just the date being set) keeps an
    // already-resolved callback from reappearing as pending.
    if (lead.stage === 'ligar_de_volta' && lead.callback_at?.startsWith(month)) {
      pushEvent(map, lead.callback_at, {
        type: 'retorno',
        label: lead.name,
        time: lead.callback_time ?? undefined,
        leadId: lead.id,
      })
    }
  }

  const year = Number(month.split('-')[0])
  for (const { date, label } of resolveCommercialDatesForYear(year)) {
    if (date.startsWith(month)) {
      pushEvent(map, date, { type: 'comercial', label })
    }
  }

  for (const date of Object.keys(map)) {
    map[date].sort((a, b) => {
      if (a.time && b.time && a.time !== b.time) return a.time.localeCompare(b.time)
      if (a.time && !b.time) return -1
      if (!a.time && b.time) return 1
      return TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
    })
  }

  return map
}

export interface AgendaStats {
  visitsToday: number
  callbacksToday: number
  next7Days: number
  overdueCallbacks: number
}

/** Formats a Date using its local calendar fields — never toISOString(), which
 *  shifts to UTC and can roll the date back a day in timezones behind UTC. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getAgendaStats(leads: Lead[], now: Date): AgendaStats {
  const today = toIsoDate(now)
  const weekEnd = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6))

  let visitsToday = 0
  let callbacksToday = 0
  let next7Days = 0
  let overdueCallbacks = 0

  for (const lead of leads) {
    if (!isActiveLead(lead)) continue

    if (lead.scheduled_visit_date === today) visitsToday++
    if (lead.scheduled_visit_date && lead.scheduled_visit_date >= today && lead.scheduled_visit_date <= weekEnd) {
      next7Days++
    }

    if (lead.stage === 'ligar_de_volta') {
      if (lead.callback_at === today) callbacksToday++
      if (lead.callback_at && lead.callback_at >= today && lead.callback_at <= weekEnd) next7Days++
      if (!lead.callback_at || lead.callback_at < today) overdueCallbacks++
    }
  }

  return { visitsToday, callbacksToday, next7Days, overdueCallbacks }
}

export function buildAgendaMonthGrid(year: number, month: number): (string | null)[][] {
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstOfMonth.getDay()

  const cells: (string | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
