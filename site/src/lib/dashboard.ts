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

  return { count: sold.length, revenueCents, profitCents }
}

export interface StoreSnapshot {
  investedCents: number
  listValueCents: number
  expectedProfitCents: number
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

  return { investedCents, listValueCents, expectedProfitCents: listValueCents - investedCents }
}
