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

export interface LeadStageAccent {
  headerBg: string
  headerText: string
  cardBorder: string
}

/**
 * Per-stage accent colors for the kanban — every value reuses a color
 * already established elsewhere in the app (Estoque's "Sem margem"
 * yellow, its "Lucro" green, the brand red) rather than introducing a new
 * palette.
 */
export const LEAD_STAGE_ACCENTS: Record<LeadStage, LeadStageAccent> = {
  novo: { headerBg: 'bg-support-gray/10', headerText: 'text-graphite', cardBorder: 'border-support-gray/40' },
  visita_marcada: { headerBg: 'bg-support-gray/10', headerText: 'text-graphite', cardBorder: 'border-support-gray/40' },
  negociando: { headerBg: 'bg-yellow-100', headerText: 'text-yellow-800', cardBorder: 'border-yellow-500' },
  ligar_de_volta: { headerBg: 'bg-support-gray/10', headerText: 'text-graphite', cardBorder: 'border-support-gray/40' },
  vendeu: { headerBg: 'bg-green-50', headerText: 'text-green-700', cardBorder: 'border-green-600' },
  nao_comprou: { headerBg: 'bg-aguiar-red/10', headerText: 'text-aguiar-red', cardBorder: 'border-aguiar-red' },
}
