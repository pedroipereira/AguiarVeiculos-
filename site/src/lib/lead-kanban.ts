import type { Lead, LeadStage } from './types'

export const LEAD_STAGES: LeadStage[] = [
  'novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou',
]

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  novo: 'Lead novo',
  visita_marcada: 'Visita marcada',
  negociando: 'Negociando',
  ligar_de_volta: 'Ligar de volta',
  vendeu: 'Vendeu',
  nao_comprou: 'Não comprou',
}

/** Splits leads into their funnel columns, preserving the caller's ordering within each column. */
export function groupLeadsByStage(leads: Lead[]): Record<LeadStage, Lead[]> {
  const groups = Object.fromEntries(LEAD_STAGES.map((stage) => [stage, [] as Lead[]])) as Record<LeadStage, Lead[]>
  for (const lead of leads) {
    groups[lead.stage].push(lead)
  }
  return groups
}

/** True when moving to "vendeu" should open the vehicle sale form instead of just changing the stage. */
export function requiresSaleCompletion(lead: Pick<Lead, 'vehicle_id'>, targetStage: LeadStage): boolean {
  return targetStage === 'vendeu' && lead.vehicle_id != null
}

/** wa.me link with no pre-filled message — just the number, digits only, with the Brazil country code. */
export function buildWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/55${digits}`
}

/**
 * Formats a `YYYY-MM-DD` date string as `DD/MM/YYYY` by splitting the string
 * directly, never via `new Date(...)` — that would parse the value as UTC
 * midnight and can roll back a day once `.toLocaleDateString()` renders it in
 * a timezone behind UTC.
 */
export function formatIsoDate(value: string): string {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}
