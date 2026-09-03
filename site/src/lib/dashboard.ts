export interface GoalProgress {
  percent: number
  remaining: number
  businessDaysLeft: number
}

/**
 * Business days = segunda a sexta, sem calendário de feriados — explicit
 * user decision, no holiday data source exists in this project.
 */
function countRemainingBusinessDays(now: Date): number {
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let day = now.getDate(); day <= lastDayOfMonth; day++) {
    const dayOfWeek = new Date(year, month, day).getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++
  }
  return count
}

export function calculateGoalProgress(soldCount: number, goal: number | null, now: Date): GoalProgress | null {
  if (goal == null || goal <= 0) return null
  return {
    percent: Math.round((soldCount / goal) * 100),
    remaining: Math.max(0, goal - soldCount),
    businessDaysLeft: countRemainingBusinessDays(now),
  }
}

/** Parses the `monthly_sales_goal` site_settings value; null/invalid/non-positive means "no goal set". */
export function parseMonthlySalesGoal(raw: string | null): number | null {
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/** Formats a Date using its local calendar fields — never toISOString(), which
 *  shifts to UTC and can roll the date back a day in timezones behind UTC. */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta)
}

export type DateRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

export interface DateRange {
  start: string
  end: string
}

export function resolveDateRange(preset: DateRangePreset, now: Date, custom?: DateRange): DateRange {
  switch (preset) {
    case 'today': {
      const iso = formatDateLocal(now)
      return { start: iso, end: iso }
    }
    case 'yesterday': {
      const iso = formatDateLocal(addDays(now, -1))
      return { start: iso, end: iso }
    }
    case 'week': {
      const dayOfWeek = now.getDay() // 0 = Sunday .. 6 = Saturday
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = addDays(now, mondayOffset)
      const sunday = addDays(monday, 6)
      return { start: formatDateLocal(monday), end: formatDateLocal(sunday) }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { start: formatDateLocal(start), end: formatDateLocal(end) }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31)
      return { start: formatDateLocal(start), end: formatDateLocal(end) }
    }
    case 'custom': {
      if (!custom) throw new Error('resolveDateRange: "custom" preset requires a custom range')
      return custom
    }
  }
}

import type { Vehicle } from './types'
import { calculateTotalCostCents, calculateRealizedMarginCents } from './vehicle-costs'

export interface SalesPanelMetrics {
  count: number
  revenueCents: number
  profitCents: number
  /** profitCents / revenueCents as a whole-number percent, 0 when there's no revenue to divide by. */
  marginPercent: number
  /** revenueCents / count, rounded to the nearest cent, 0 when there were no sales in the range. */
  averageSaleCents: number
}

function isWithinRange(dateValue: string | null, range: DateRange): boolean {
  return dateValue != null && dateValue >= range.start && dateValue <= range.end
}

export function getSalesPanelMetrics(
  vehicles: Vehicle[],
  expenseTotals: Record<string, number>,
  range: DateRange,
): SalesPanelMetrics {
  const sold = vehicles.filter((vehicle) => isWithinRange(vehicle.sold_at, range))

  let revenueCents = 0
  let profitCents = 0
  for (const vehicle of sold) {
    revenueCents += vehicle.sale_price_cents ?? 0
    const totalCostCents = calculateTotalCostCents(vehicle.acquisition_cost_cents, [
      { amount_cents: expenseTotals[vehicle.id] ?? 0 },
    ])
    profitCents += calculateRealizedMarginCents(vehicle.sale_price_cents, totalCostCents) ?? 0
  }

  return {
    count: sold.length,
    revenueCents,
    profitCents,
    marginPercent: revenueCents > 0 ? Math.round((profitCents / revenueCents) * 100) : 0,
    averageSaleCents: sold.length > 0 ? Math.round(revenueCents / sold.length) : 0,
  }
}

export interface StoreSnapshot {
  investedCents: number
  listValueCents: number
  expectedProfitCents: number
  vehicleCount: number
}

export function getStoreSnapshot(vehicles: Vehicle[], expenseTotals: Record<string, number>): StoreSnapshot {
  const inStock = vehicles.filter((vehicle) => vehicle.status === 'available' || vehicle.status === 'preparing')

  let investedCents = 0
  let listValueCents = 0
  for (const vehicle of inStock) {
    investedCents += calculateTotalCostCents(vehicle.acquisition_cost_cents, [
      { amount_cents: expenseTotals[vehicle.id] ?? 0 },
    ])
    listValueCents += vehicle.price_cents
  }

  return { investedCents, listValueCents, expectedProfitCents: listValueCents - investedCents, vehicleCount: inStock.length }
}

import type { Lead, LeadStage } from './types'
import { LEAD_STAGE_LABELS, LEAD_STAGES } from './lead-kanban'

export type FunnelStage = Exclude<LeadStage, 'nao_comprou'>

export const FUNNEL_STAGES: FunnelStage[] = LEAD_STAGES.filter(
  (stage): stage is FunnelStage => stage !== 'nao_comprou',
)

export interface FunnelStageCount {
  stage: FunnelStage
  label: string
  count: number
}

export function getFunnelData(leads: Lead[]): FunnelStageCount[] {
  return FUNNEL_STAGES.map((stage) => ({
    stage,
    label: LEAD_STAGE_LABELS[stage],
    count: leads.filter((lead) => lead.stage === stage).length,
  }))
}

export type TimeSeriesGranularity = 'day' | 'week' | 'month'

export interface SalesTimeSeriesPoint {
  bucketLabel: string
  count: number
}

const MONTH_SHORT_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function resolveBucket(
  granularity: TimeSeriesGranularity,
  now: Date,
  offsetFromNow: number,
): { start: string; end: string; label: string } {
  if (granularity === 'day') {
    const date = addDays(now, -offsetFromNow)
    const iso = formatDateLocal(date)
    return { start: iso, end: iso, label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}` }
  }

  if (granularity === 'week') {
    const anchor = addDays(now, -offsetFromNow * 7)
    const dayOfWeek = anchor.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = addDays(anchor, mondayOffset)
    const sunday = addDays(monday, 6)
    return {
      start: formatDateLocal(monday),
      end: formatDateLocal(sunday),
      label: `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`,
    }
  }

  const monthDate = new Date(now.getFullYear(), now.getMonth() - offsetFromNow, 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  return {
    start: formatDateLocal(monthDate),
    end: formatDateLocal(monthEnd),
    label: MONTH_SHORT_LABELS[monthDate.getMonth()],
  }
}

export function getSalesTimeSeries(
  vehicles: Vehicle[],
  granularity: TimeSeriesGranularity,
  buckets: number,
  now: Date,
): SalesTimeSeriesPoint[] {
  const points: SalesTimeSeriesPoint[] = []
  for (let offsetFromNow = buckets - 1; offsetFromNow >= 0; offsetFromNow--) {
    const { start, end, label } = resolveBucket(granularity, now, offsetFromNow)
    const count = vehicles.filter((vehicle) => isWithinRange(vehicle.sold_at, { start, end })).length
    points.push({ bucketLabel: label, count })
  }
  return points
}
