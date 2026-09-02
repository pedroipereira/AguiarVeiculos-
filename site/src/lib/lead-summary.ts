import type { Lead, Vehicle } from './types'

export interface LeadSummaryCounts {
  active: number
  negotiating: number
  overdue: number
  soldInMonth: number
}

function parseScheduledVisitDateTime(dateStr: string, timeStr: string | null): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = (timeStr ?? '23:59').split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute)
}

/** True when a lead sits in "visita marcada" and that visit's date/time has already passed. */
export function isOverdueReturn(
  lead: Pick<Lead, 'stage' | 'scheduled_visit_date' | 'scheduled_visit_time'>,
  now: Date = new Date(),
): boolean {
  if (lead.stage !== 'visita_marcada' || !lead.scheduled_visit_date) return false
  return parseScheduledVisitDateTime(lead.scheduled_visit_date, lead.scheduled_visit_time) < now
}

/** True when `soldAt` is set and falls within `month`, which must be a valid `YYYY-MM` string. */
function matchesMonth(soldAt: string | null | undefined, month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month) && !!soldAt && soldAt.startsWith(month)
}

/**
 * Counts for the 4 summary cards. Only `soldInMonth` depends on `month` —
 * the other three always reflect the current state, never a past month
 * (there is no stage-change history to reconstruct "who was active in May").
 */
export function getLeadSummaryCounts(
  leads: Lead[],
  vehicles: Vehicle[],
  month: string,
  now: Date = new Date(),
): LeadSummaryCounts {
  return {
    active: leads.filter((lead) => lead.stage !== 'vendeu' && lead.stage !== 'nao_comprou').length,
    negotiating: leads.filter((lead) => lead.stage === 'negociando').length,
    overdue: leads.filter((lead) => isOverdueReturn(lead, now)).length,
    soldInMonth: vehicles.filter((vehicle) => matchesMonth(vehicle.sold_at, month)).length,
  }
}

/**
 * Buyers whose vehicle sold within `month` (YYYY-MM). Resolves the buyer from
 * `vehicle.buyer_lead_id` first — the field the sale-recording action actually
 * writes (both the kanban "Vendeu" flow and Estoque's "Marcar como vendido"
 * flow set it) — falling back to the kanban flow's lead-side link
 * (`lead.stage === 'vendeu' && lead.vehicle_id === vehicle.id`) for cases
 * where `buyer_lead_id` might be unset but that link still applies.
 */
export function getBuyers(leads: Lead[], vehicles: Vehicle[], month: string): { lead: Lead; vehicle: Vehicle }[] {
  const buyers: { lead: Lead; vehicle: Vehicle }[] = []
  for (const vehicle of vehicles) {
    if (!matchesMonth(vehicle.sold_at, month)) continue
    const lead =
      leads.find((candidate) => candidate.id === vehicle.buyer_lead_id) ??
      leads.find((candidate) => candidate.stage === 'vendeu' && candidate.vehicle_id === vehicle.id)
    if (lead) buyers.push({ lead, vehicle })
  }
  return buyers
}

/** Current month as `YYYY-MM`, for the filter's default value. */
export function getCurrentMonthValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
