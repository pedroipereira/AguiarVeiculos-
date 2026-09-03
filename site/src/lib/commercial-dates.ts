/**
 * `month` is 1-indexed (1 = janeiro) for readability in this table; `weekday`
 * follows JS's `Date.getDay()` convention (0 = domingo .. 6 = sábado).
 */
export type CommercialDateRule =
  | { type: 'fixed'; month: number; day: number; label: string }
  | { type: 'nth-weekday'; month: number; weekday: number; occurrence: number; label: string }
  | { type: 'last-weekday'; month: number; weekday: number; label: string }

/**
 * Datas com potencial de campanha pro varejo automotivo brasileiro. Lista
 * curada — ajustes futuros (adicionar/remover uma data) são pedidos
 * diretamente e viram uma mudança de código aqui, sem migration nem tela.
 */
export const COMMERCIAL_DATES: CommercialDateRule[] = [
  { type: 'fixed', month: 3, day: 15, label: 'Dia do Consumidor' },
  { type: 'nth-weekday', month: 5, weekday: 0, occurrence: 2, label: 'Dia das Mães' },
  { type: 'fixed', month: 6, day: 12, label: 'Dia dos Namorados' },
  { type: 'fixed', month: 7, day: 25, label: 'Dia do Motorista' },
  { type: 'nth-weekday', month: 8, weekday: 0, occurrence: 2, label: 'Dia dos Pais' },
  { type: 'fixed', month: 9, day: 15, label: 'Dia do Cliente' },
  { type: 'fixed', month: 11, day: 8, label: 'Dia Mundial do Automóvel' },
  { type: 'last-weekday', month: 11, weekday: 5, label: 'Black Friday' },
  { type: 'fixed', month: 12, day: 25, label: 'Natal' },
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function resolveRule(rule: CommercialDateRule, year: number): string | null {
  if (rule.type === 'fixed') {
    return `${year}-${pad(rule.month)}-${pad(rule.day)}`
  }

  const monthIndex = rule.month - 1 // JS Date months are 0-indexed

  if (rule.type === 'nth-weekday') {
    const firstOfMonth = new Date(year, monthIndex, 1)
    const firstWeekdayOffset = (rule.weekday - firstOfMonth.getDay() + 7) % 7
    const day = 1 + firstWeekdayOffset + (rule.occurrence - 1) * 7
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    if (day > daysInMonth) return null // e.g. a "5th Sunday" that doesn't exist that month/year
    return `${year}-${pad(rule.month)}-${pad(day)}`
  }

  // last-weekday
  const lastOfMonth = new Date(year, monthIndex + 1, 0)
  const lastWeekdayOffset = (lastOfMonth.getDay() - rule.weekday + 7) % 7
  const day = lastOfMonth.getDate() - lastWeekdayOffset
  return `${year}-${pad(rule.month)}-${pad(day)}`
}

export function resolveCommercialDatesForYear(
  year: number,
  rules: CommercialDateRule[] = COMMERCIAL_DATES,
): { date: string; label: string }[] {
  return rules
    .map((rule) => ({ date: resolveRule(rule, year), label: rule.label }))
    .filter((entry): entry is { date: string; label: string } => entry.date !== null)
}
