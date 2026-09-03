import type { Lead, LeadStage } from './types'

export const LEAD_STAGES: LeadStage[] = [
  'novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou',
]

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  novo: 'Lead novo',
  visita_marcada: 'Visita marcada',
  negociando: 'Negociando',
  ligar_de_volta: 'Ligar de volta',
  vendeu: 'Comprou',
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
 * Per-stage accent colors for the kanban — one distinct color per stage
 * (requested after testing showed 3 stages sharing the same neutral gray
 * was hard to tell apart at a glance), following the same
 * one-color-per-stage pattern as the revendcar.com.br reference used to
 * design this board.
 */
export const LEAD_STAGE_ACCENTS: Record<LeadStage, LeadStageAccent> = {
  novo: { headerBg: 'bg-blue-100', headerText: 'text-blue-800', cardBorder: 'border-blue-500' },
  visita_marcada: { headerBg: 'bg-orange-100', headerText: 'text-orange-800', cardBorder: 'border-orange-500' },
  negociando: { headerBg: 'bg-yellow-100', headerText: 'text-yellow-800', cardBorder: 'border-yellow-500' },
  ligar_de_volta: { headerBg: 'bg-pink-100', headerText: 'text-pink-800', cardBorder: 'border-pink-500' },
  vendeu: { headerBg: 'bg-green-50', headerText: 'text-green-700', cardBorder: 'border-green-600' },
  nao_comprou: { headerBg: 'bg-graphite/10', headerText: 'text-graphite', cardBorder: 'border-graphite' },
}
