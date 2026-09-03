/**
 * `month` is 1-indexed (1 = janeiro) for readability in this table; `weekday`
 * follows JS's `Date.getDay()` convention (0 = domingo .. 6 = sábado).
 */
export type CommercialDateRule =
  | { type: 'fixed'; month: number; day: number; label: string }
  | { type: 'nth-weekday'; month: number; weekday: number; occurrence: number; label: string }
  | { type: 'last-weekday'; month: number; weekday: number; label: string }
  | { type: 'easter-relative'; offsetDays: number; label: string }

/**
 * Datas com potencial de campanha pro varejo automotivo brasileiro. Lista
 * curada — ajustes futuros (adicionar/remover uma data) são pedidos
 * diretamente e viram uma mudança de código aqui, sem migration nem tela.
 */
export const COMMERCIAL_DATES: CommercialDateRule[] = [
  { type: 'fixed', month: 1, day: 1, label: 'Ano Novo' },
  // Móveis, calculados a partir do Domingo de Páscoa daquele ano.
  { type: 'easter-relative', offsetDays: -47, label: 'Carnaval' },
  { type: 'easter-relative', offsetDays: -2, label: 'Sexta-feira Santa' },
  { type: 'fixed', month: 3, day: 15, label: 'Dia do Consumidor' },
  { type: 'fixed', month: 4, day: 21, label: 'Tiradentes' },
  { type: 'fixed', month: 5, day: 1, label: 'Dia do Trabalho' },
  { type: 'nth-weekday', month: 5, weekday: 0, occurrence: 2, label: 'Dia das Mães' },
  { type: 'easter-relative', offsetDays: 60, label: 'Corpus Christi' },
  { type: 'fixed', month: 6, day: 12, label: 'Dia dos Namorados' },
  { type: 'fixed', month: 7, day: 25, label: 'Dia do Motorista' },
  { type: 'nth-weekday', month: 8, weekday: 0, occurrence: 2, label: 'Dia dos Pais' },
  { type: 'fixed', month: 9, day: 7, label: 'Independência do Brasil' },
  { type: 'fixed', month: 9, day: 15, label: 'Dia do Cliente' },
  { type: 'fixed', month: 10, day: 12, label: 'Nossa Senhora Aparecida' },
  { type: 'fixed', month: 11, day: 2, label: 'Finados' },
  { type: 'fixed', month: 11, day: 8, label: 'Dia Mundial do Automóvel' },
  { type: 'fixed', month: 11, day: 15, label: 'Proclamação da República' },
  { type: 'fixed', month: 11, day: 20, label: 'Consciência Negra' },
  { type: 'last-weekday', month: 11, weekday: 5, label: 'Black Friday' },
  // 2ª parcela do 13º salário (prazo legal: 20/12) — quando o dinheiro cheio
  // costuma estar na mão do cliente, maior janela de compra de carro do ano.
  { type: 'fixed', month: 12, day: 20, label: '2ª parcela do 13º salário' },
  { type: 'fixed', month: 12, day: 25, label: 'Natal' },
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Anonymous Gregorian algorithm (Meeus/Jones/Butcher) for the date of
 * Easter Sunday in a given year — valid for the Gregorian calendar
 * (1583 onward). Returns 1-indexed month, matching this file's convention.
 * Verified against known Easter dates: 2026-04-05, 2027-03-28.
 */
function calculateEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

function resolveRule(rule: CommercialDateRule, year: number): string | null {
  if (rule.type === 'fixed') {
    return `${year}-${pad(rule.month)}-${pad(rule.day)}`
  }

  if (rule.type === 'easter-relative') {
    const easter = calculateEasterSunday(year)
    const easterDate = new Date(year, easter.month - 1, easter.day)
    const result = new Date(easterDate.getFullYear(), easterDate.getMonth(), easterDate.getDate() + rule.offsetDays)
    return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}`
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
