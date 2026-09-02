# Painel Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/admin` (the Painel page) into a dashboard that aggregates Estoque and Leads/CRM data: a monthly sales-goal progress banner, a period-filterable sales panel (Lucro/Faturamento/Vendas), a current-inventory financial snapshot, a lead funnel chart, the existing stock-turnover widgets, and a sales-over-time chart.

**Architecture:** All aggregation math lives in new pure functions in `src/lib/dashboard.ts` (no network, fully unit-tested), reusing existing pure helpers (`vehicle-costs.ts`, `lead-summary.ts`, `lead-kanban.ts`) rather than duplicating margin/date logic. Each dashboard section is its own presentational component in `src/components/admin/`, wired together in `src/app/admin/(dashboard)/page.tsx`, which does the one Supabase round-trip per data source and passes plain props down — no component fetches its own data.

**Tech Stack:** Next.js 15 (App Router), React 19, Supabase (Postgres), Tailwind (existing brand tokens), Vitest + Testing Library, **Recharts** (new dependency, for the funnel and time-series charts).

**Spec:** [docs/superpowers/specs/2026-09-02-painel-dashboard-design.md](../specs/2026-09-02-painel-dashboard-design.md)

## Global Constraints

- No new tables — only one additive migration adding a `monthly_sales_goal` row to the existing `site_settings` table.
- Dias úteis (business days) = segunda a sexta, sem calendário de feriados (explicit user decision).
- The sales-over-time chart plots **number of vendas**, not faturamento — no metric toggle (explicit user decision).
- No new brand colors for text/UI chrome — only the funnel chart's per-stage fills may use plain hex values (SVG `fill` needs literal colors, Tailwind classes don't apply inside Recharts), matching the same blue/orange/yellow/pink/green already used by `LEAD_STAGE_ACCENTS`.
- Nenhum dado financeiro/de meta agregado neste Painel deve vazar para nenhuma rota pública — mesma garantia estrutural já usada no Estoque (view `vehicles_public` com whitelist).
- Every new pure function ships with unit tests with no network dependency, following the existing `tests/lib/*.test.ts` style (plain `describe`/`it`, a local `makeVehicle`/`makeLead` fixture builder with overrides).
- Elementos explicitamente fora de escopo (não implementar): projeção de ritmo na faixa de meta, faixa de alerta de veículos sem margem, "ticket médio", toggle Faturamento/Vendas no gráfico de série temporal, qualquer coisa do sub-projeto 5 (Metas) além do número único `monthly_sales_goal`.

---

## File Structure

- `site/supabase/migrations/0008_monthly_sales_goal.sql` — new migration, one `site_settings` row.
- `site/src/lib/dashboard.ts` — new file, all pure aggregation functions (goal progress, date-range resolution, sales-panel metrics, store snapshot, funnel data, time-series data).
- `site/tests/lib/dashboard.test.ts` — new file, unit tests for everything in `dashboard.ts`.
- `site/src/components/admin/GoalProgressBanner.tsx` (+ test) — meta progress bar with inline edit, same pattern as `StockTurnoverCard.tsx`.
- `site/src/components/admin/SalesPanel.tsx` (+ test) — period selector + Lucro/Faturamento/Vendas.
- `site/src/components/admin/StoreSnapshotCard.tsx` (+ test) — "Sua loja agora" 3-number snapshot.
- `site/src/components/admin/LeadFunnelChart.tsx` (+ test) — Recharts funnel of leads by stage.
- `site/src/components/admin/SalesTimeSeriesChart.tsx` (+ test) — Recharts bar chart of vendas by period.
- `site/src/app/admin/(dashboard)/page.tsx` — modified: loads leads + expense totals + the new setting, renders the new sections around the two components already there (`StockTurnoverCard`, `StockAgingList`, untouched).
- `site/tests/setup.ts` — modified: add a `ResizeObserver` polyfill so Recharts' `ResponsiveContainer` doesn't throw under jsdom.
- `site/package.json` — modified: adds `recharts`.

---

### Task 1: Migration — `monthly_sales_goal` site setting

**Files:**
- Create: `site/supabase/migrations/0008_monthly_sales_goal.sql`

**Interfaces:**
- Produces: a `site_settings` row with `key = 'monthly_sales_goal'`, readable via the existing `getSiteSetting(client, 'monthly_sales_goal')` (`src/lib/queries/site-settings.ts`, already generic, no change needed) and writable via the existing `adminSetSiteSetting('monthly_sales_goal', value)` server action (`src/app/actions/site-settings.ts`, already generic, no change needed).

- [ ] **Step 1: Write the migration**

```sql
-- No default value — an unset goal means "no goal defined yet", surfaced
-- as an empty state in the Painel rather than a misleading 0.
insert into site_settings (key, value) values ('monthly_sales_goal', null)
  on conflict (key) do nothing;
```

- [ ] **Step 2: Apply the migration to the live Supabase project**

Use the Supabase MCP tool (`apply_migration`) with this project — check `site/.env.local`'s `NEXT_PUBLIC_SUPABASE_URL` first to confirm which project ref is current (there are two projects under this org; only one matches the app). Name the migration `monthly_sales_goal`.

- [ ] **Step 3: Verify**

Query `select * from site_settings where key = 'monthly_sales_goal'` (via `execute_sql` MCP tool) and confirm one row exists with `value = null`.

- [ ] **Step 4: Commit**

```bash
git add site/supabase/migrations/0008_monthly_sales_goal.sql
git commit -m "feat(painel): add monthly_sales_goal site setting"
```

---

### Task 2: `dashboard.ts` — `calculateGoalProgress`

**Files:**
- Create: `site/src/lib/dashboard.ts`
- Test: `site/tests/lib/dashboard.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface GoalProgress {
    percent: number
    remaining: number
    businessDaysLeft: number
  }

  export function calculateGoalProgress(soldCount: number, goal: number | null, now: Date): GoalProgress | null
  ```

- [ ] **Step 1: Write the failing tests**

```typescript
// site/tests/lib/dashboard.test.ts
import { describe, it, expect } from 'vitest'
import { calculateGoalProgress } from '@/lib/dashboard'

describe('calculateGoalProgress', () => {
  it('returns null when no goal is set', () => {
    expect(calculateGoalProgress(5, null, new Date(2026, 8, 1))).toBeNull()
  })

  it('returns null when the goal is zero or negative', () => {
    expect(calculateGoalProgress(5, 0, new Date(2026, 8, 1))).toBeNull()
    expect(calculateGoalProgress(5, -3, new Date(2026, 8, 1))).toBeNull()
  })

  it('computes percent and remaining, counting all weekdays in the month from the 1st', () => {
    // 2026-09-01 is a Tuesday; September 2026 has 22 weekdays total.
    const result = calculateGoalProgress(12, 20, new Date(2026, 8, 1))
    expect(result).toEqual({ percent: 60, remaining: 8, businessDaysLeft: 22 })
  })

  it('counts remaining business days from a weekday "now" through end of month, excluding weekends', () => {
    // 2026-09-25 is a Friday; weekdays left in September from the 25th: 25(Fri),28(Mon),29(Tue),30(Wed) = 4.
    const result = calculateGoalProgress(10, 20, new Date(2026, 8, 25))
    expect(result?.businessDaysLeft).toBe(4)
  })

  it('counts remaining business days from a weekend "now", excluding today itself', () => {
    // 2026-09-27 is a Sunday; weekdays left: 28(Mon),29(Tue),30(Wed) = 3.
    const result = calculateGoalProgress(10, 20, new Date(2026, 8, 27))
    expect(result?.businessDaysLeft).toBe(3)
  })

  it('floors remaining at zero and allows percent over 100 once the goal is exceeded', () => {
    const result = calculateGoalProgress(25, 20, new Date(2026, 8, 1))
    expect(result?.remaining).toBe(0)
    expect(result?.percent).toBe(125)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: FAIL — `Cannot find module '@/lib/dashboard'` (file doesn't exist yet).

- [ ] **Step 3: Implement**

```typescript
// site/src/lib/dashboard.ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/dashboard.ts site/tests/lib/dashboard.test.ts
git commit -m "feat(painel): add calculateGoalProgress"
```

---

### Task 3: `dashboard.ts` — `resolveDateRange`

**Files:**
- Modify: `site/src/lib/dashboard.ts`
- Test: `site/tests/lib/dashboard.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```typescript
  export type DateRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

  export interface DateRange {
    start: string // 'YYYY-MM-DD'
    end: string // 'YYYY-MM-DD'
  }

  export function resolveDateRange(preset: DateRangePreset, now: Date, custom?: DateRange): DateRange
  ```
  Internal (not exported, but reused by Task 7): `formatDateLocal(date: Date): string`, `addDays(date: Date, delta: number): Date`.

- [ ] **Step 1: Write the failing tests**

```typescript
// append to site/tests/lib/dashboard.test.ts
import { resolveDateRange } from '@/lib/dashboard'

describe('resolveDateRange', () => {
  const NOW = new Date(2026, 8, 25) // Friday, September 25th 2026

  it('resolves "today" and "yesterday" as single-day ranges', () => {
    expect(resolveDateRange('today', NOW)).toEqual({ start: '2026-09-25', end: '2026-09-25' })
    expect(resolveDateRange('yesterday', NOW)).toEqual({ start: '2026-09-24', end: '2026-09-24' })
  })

  it('resolves "week" as the Monday-Sunday containing "now"', () => {
    expect(resolveDateRange('week', NOW)).toEqual({ start: '2026-09-21', end: '2026-09-27' })
  })

  it('resolves "week" the same way when "now" itself falls on a Sunday', () => {
    expect(resolveDateRange('week', new Date(2026, 8, 27))).toEqual({ start: '2026-09-21', end: '2026-09-27' })
  })

  it('resolves "month" as the full current calendar month', () => {
    expect(resolveDateRange('month', NOW)).toEqual({ start: '2026-09-01', end: '2026-09-30' })
  })

  it('resolves "year" as the full current calendar year', () => {
    expect(resolveDateRange('year', NOW)).toEqual({ start: '2026-01-01', end: '2026-12-31' })
  })

  it('passes "custom" through unchanged, including an inverted range', () => {
    expect(resolveDateRange('custom', NOW, { start: '2026-01-10', end: '2026-01-05' })).toEqual({
      start: '2026-01-10',
      end: '2026-01-05',
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: FAIL — `resolveDateRange is not exported`

- [ ] **Step 3: Implement**

```typescript
// add to site/src/lib/dashboard.ts

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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: PASS (12 tests total)

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/dashboard.ts site/tests/lib/dashboard.test.ts
git commit -m "feat(painel): add resolveDateRange"
```

---

### Task 4: `dashboard.ts` — `getSalesPanelMetrics`

**Files:**
- Modify: `site/src/lib/dashboard.ts`
- Test: `site/tests/lib/dashboard.test.ts`

**Interfaces:**
- Consumes: `DateRange` (Task 3); `calculateTotalCostCents`, `calculateRealizedMarginCents` from `src/lib/vehicle-costs.ts` (existing, signatures: `calculateTotalCostCents(acquisitionCostCents: number | null | undefined, expenses: { amount_cents: number }[]): number`, `calculateRealizedMarginCents(salePriceCents: number | null | undefined, totalCostCents: number): number | null`); `Vehicle` from `src/lib/types.ts`.
- Produces:
  ```typescript
  export interface SalesPanelMetrics {
    count: number
    revenueCents: number
    profitCents: number
  }

  export function getSalesPanelMetrics(
    vehicles: Vehicle[],
    expenseTotals: Record<string, number>,
    range: DateRange,
  ): SalesPanelMetrics
  ```

- [ ] **Step 1: Write the failing tests**

```typescript
// append to site/tests/lib/dashboard.test.ts
import { getSalesPanelMetrics } from '@/lib/dashboard'
import type { Vehicle } from '@/lib/types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2024, year_fabrication: 2024, mileage_km: 10000, price_cents: 8000000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null,
    horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null,
    fipe_value_cents: null, fipe_fetched_at: null, optionals: [],
    ...overrides,
  }
}

describe('getSalesPanelMetrics', () => {
  const range = { start: '2026-09-01', end: '2026-09-30' }

  it('counts only vehicles sold within the range', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-15', sale_price_cents: 5000000 }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-08-31', sale_price_cents: 4000000 }),
      makeVehicle({ id: 'c', status: 'available', sold_at: null }),
    ]
    expect(getSalesPanelMetrics(vehicles, {}, range).count).toBe(1)
  })

  it('sums sale_price_cents as revenue', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-01', sale_price_cents: 5000000 }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-09-30', sale_price_cents: 3000000 }),
    ]
    expect(getSalesPanelMetrics(vehicles, {}, range).revenueCents).toBe(8000000)
  })

  it('sums realized margin (sale price minus acquisition cost minus expenses) as profit', () => {
    const vehicles = [
      makeVehicle({
        id: 'a', status: 'sold', sold_at: '2026-09-10',
        sale_price_cents: 5000000, acquisition_cost_cents: 3000000,
      }),
    ]
    // profit = 5,000,000 - 3,000,000 - 200,000 (expenses) = 1,800,000
    expect(getSalesPanelMetrics(vehicles, { a: 200000 }, range).profitCents).toBe(1800000)
  })

  it('returns zeros for an empty (inverted custom) range', () => {
    const vehicles = [makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000 })]
    const inverted = { start: '2026-09-20', end: '2026-09-10' }
    expect(getSalesPanelMetrics(vehicles, {}, inverted)).toEqual({ count: 0, revenueCents: 0, profitCents: 0 })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: FAIL — `getSalesPanelMetrics is not exported`

- [ ] **Step 3: Implement**

```typescript
// add to site/src/lib/dashboard.ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: PASS (16 tests total)

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/dashboard.ts site/tests/lib/dashboard.test.ts
git commit -m "feat(painel): add getSalesPanelMetrics"
```

---

### Task 5: `dashboard.ts` — `getStoreSnapshot`

**Files:**
- Modify: `site/src/lib/dashboard.ts`
- Test: `site/tests/lib/dashboard.test.ts`

**Interfaces:**
- Consumes: `Vehicle`, `calculateTotalCostCents` (same as Task 4).
- Produces:
  ```typescript
  export interface StoreSnapshot {
    investedCents: number
    listValueCents: number
    expectedProfitCents: number
  }

  export function getStoreSnapshot(vehicles: Vehicle[], expenseTotals: Record<string, number>): StoreSnapshot
  ```

- [ ] **Step 1: Write the failing tests**

```typescript
// append to site/tests/lib/dashboard.test.ts
import { getStoreSnapshot } from '@/lib/dashboard'

describe('getStoreSnapshot', () => {
  it('includes only available and preparing vehicles, excluding sold', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'available', price_cents: 5000000, acquisition_cost_cents: 3000000 }),
      makeVehicle({ id: 'b', status: 'preparing', price_cents: 6000000, acquisition_cost_cents: 4000000 }),
      makeVehicle({ id: 'c', status: 'sold', price_cents: 7000000, acquisition_cost_cents: 5000000 }),
    ]
    const snapshot = getStoreSnapshot(vehicles, {})
    expect(snapshot.listValueCents).toBe(11000000)
    expect(snapshot.investedCents).toBe(7000000)
  })

  it('computes expected profit as list value minus invested', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'available', price_cents: 5000000, acquisition_cost_cents: 3000000 }),
    ]
    expect(getStoreSnapshot(vehicles, { a: 200000 }).expectedProfitCents).toBe(1800000)
  })

  it('treats a missing acquisition cost as zero invested for that vehicle', () => {
    const vehicles = [makeVehicle({ id: 'a', status: 'available', price_cents: 5000000, acquisition_cost_cents: null })]
    expect(getStoreSnapshot(vehicles, {}).investedCents).toBe(0)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: FAIL — `getStoreSnapshot is not exported`

- [ ] **Step 3: Implement**

```typescript
// add to site/src/lib/dashboard.ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: PASS (19 tests total)

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/dashboard.ts site/tests/lib/dashboard.test.ts
git commit -m "feat(painel): add getStoreSnapshot"
```

---

### Task 6: `dashboard.ts` — `getFunnelData`

**Files:**
- Modify: `site/src/lib/dashboard.ts`
- Test: `site/tests/lib/dashboard.test.ts`

**Interfaces:**
- Consumes: `Lead`, `LeadStage` from `src/lib/types.ts`; `LEAD_STAGE_LABELS` from `src/lib/lead-kanban.ts` (existing, `Record<LeadStage, string>`).
- Produces:
  ```typescript
  export const FUNNEL_STAGES: LeadStage[] // ['novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu']

  export interface FunnelStageCount {
    stage: LeadStage
    label: string
    count: number
  }

  export function getFunnelData(leads: Lead[]): FunnelStageCount[]
  ```

- [ ] **Step 1: Write the failing tests**

```typescript
// append to site/tests/lib/dashboard.test.ts
import { getFunnelData } from '@/lib/dashboard'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Cliente', phone: '99999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getFunnelData', () => {
  it('counts leads per funnel stage, in funnel order', () => {
    const leads = [
      makeLead({ id: '1', stage: 'novo' }),
      makeLead({ id: '2', stage: 'novo' }),
      makeLead({ id: '3', stage: 'negociando' }),
      makeLead({ id: '4', stage: 'vendeu' }),
    ]
    expect(getFunnelData(leads)).toEqual([
      { stage: 'novo', label: 'Lead novo', count: 2 },
      { stage: 'visita_marcada', label: 'Visita marcada', count: 0 },
      { stage: 'negociando', label: 'Negociando', count: 1 },
      { stage: 'ligar_de_volta', label: 'Ligar de volta', count: 0 },
      { stage: 'vendeu', label: 'Vendeu', count: 1 },
    ])
  })

  it('excludes "não comprou" leads from the funnel entirely', () => {
    const leads = [makeLead({ id: '1', stage: 'nao_comprou' })]
    const total = getFunnelData(leads).reduce((sum, entry) => sum + entry.count, 0)
    expect(total).toBe(0)
  })

  it('returns all five stages at zero for an empty lead list', () => {
    expect(getFunnelData([])).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: FAIL — `getFunnelData is not exported`

- [ ] **Step 3: Implement**

```typescript
// add to site/src/lib/dashboard.ts
import type { Lead, LeadStage } from './types'
import { LEAD_STAGE_LABELS } from './lead-kanban'

export const FUNNEL_STAGES: LeadStage[] = ['novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu']

export interface FunnelStageCount {
  stage: LeadStage
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: PASS (22 tests total)

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/dashboard.ts site/tests/lib/dashboard.test.ts
git commit -m "feat(painel): add getFunnelData"
```

---

### Task 7: `dashboard.ts` — `getSalesTimeSeries`

**Files:**
- Modify: `site/src/lib/dashboard.ts`
- Test: `site/tests/lib/dashboard.test.ts`

**Interfaces:**
- Consumes: `Vehicle`; `formatDateLocal`/`addDays` (private helpers from Task 3, same file).
- Produces:
  ```typescript
  export type TimeSeriesGranularity = 'day' | 'week' | 'month'

  export interface SalesTimeSeriesPoint {
    bucketLabel: string
    count: number
  }

  export function getSalesTimeSeries(
    vehicles: Vehicle[],
    granularity: TimeSeriesGranularity,
    buckets: number,
    now: Date,
  ): SalesTimeSeriesPoint[]
  ```

- [ ] **Step 1: Write the failing tests**

```typescript
// append to site/tests/lib/dashboard.test.ts
import { getSalesTimeSeries } from '@/lib/dashboard'

describe('getSalesTimeSeries', () => {
  const NOW = new Date(2026, 8, 25) // September 25th 2026

  it('buckets sold vehicles per day, oldest first, keeping empty days at zero', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-23' }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-09-25' }),
    ]
    const series = getSalesTimeSeries(vehicles, 'day', 3, NOW)
    expect(series).toEqual([
      { bucketLabel: '23/09', count: 1 },
      { bucketLabel: '24/09', count: 0 },
      { bucketLabel: '25/09', count: 1 },
    ])
  })

  it('buckets sold vehicles per month, oldest first', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-07-10' }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-09-05' }),
      makeVehicle({ id: 'c', status: 'sold', sold_at: '2026-09-20' }),
    ]
    const series = getSalesTimeSeries(vehicles, 'month', 3, NOW)
    expect(series).toEqual([
      { bucketLabel: 'Jul', count: 1 },
      { bucketLabel: 'Ago', count: 0 },
      { bucketLabel: 'Set', count: 2 },
    ])
  })

  it('ignores vehicles with no sold_at', () => {
    const vehicles = [makeVehicle({ id: 'a', status: 'available', sold_at: null })]
    const series = getSalesTimeSeries(vehicles, 'day', 1, NOW)
    expect(series).toEqual([{ bucketLabel: '25/09', count: 0 }])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: FAIL — `getSalesTimeSeries is not exported`

- [ ] **Step 3: Implement**

```typescript
// add to site/src/lib/dashboard.ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/dashboard.test.ts`
Expected: PASS (25 tests total)

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/dashboard.ts site/tests/lib/dashboard.test.ts
git commit -m "feat(painel): add getSalesTimeSeries"
```

---

### Task 8: `GoalProgressBanner` component

**Files:**
- Create: `site/src/components/admin/GoalProgressBanner.tsx`
- Test: `site/tests/components/admin/GoalProgressBanner.test.tsx`

**Interfaces:**
- Consumes: `calculateGoalProgress` (Task 2); `adminSetSiteSetting(key: string, value: string): Promise<void>` from `@/app/actions/site-settings` (existing); `Button` from `@/components/ui/Button` (existing); `anton` from `@/lib/fonts` (existing).
- Produces: `GoalProgressBanner({ soldCount: number, goal: number | null, now?: Date })` — used by Task 14.

- [ ] **Step 1: Write the failing tests**

```typescript
// site/tests/components/admin/GoalProgressBanner.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminSetSiteSetting } = vi.hoisted(() => ({ adminSetSiteSetting: vi.fn() }))
vi.mock('@/app/actions/site-settings', () => ({ adminSetSiteSetting }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { GoalProgressBanner } from '@/components/admin/GoalProgressBanner'

const NOW = new Date(2026, 8, 1)

describe('GoalProgressBanner', () => {
  it('shows progress when a goal is set', () => {
    render(<GoalProgressBanner soldCount={12} goal={20} now={NOW} />)
    expect(screen.getByText('12 de 20 vendas')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText(/Faltam 8 em 22 dias úteis/)).toBeInTheDocument()
  })

  it('shows an empty state when no goal is set', () => {
    render(<GoalProgressBanner soldCount={12} goal={null} now={NOW} />)
    expect(screen.getByText('Nenhuma meta definida para este mês')).toBeInTheDocument()
  })

  it('saves a new goal and refreshes the page', async () => {
    render(<GoalProgressBanner soldCount={12} goal={20} now={NOW} />)

    fireEvent.click(screen.getByRole('button', { name: /editar meta/i }))
    fireEvent.change(screen.getByLabelText(/meta de vendas do mês/i), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('monthly_sales_goal', '25'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/components/admin/GoalProgressBanner.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// site/src/components/admin/GoalProgressBanner.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'
import { calculateGoalProgress } from '@/lib/dashboard'
import { anton } from '@/lib/fonts'

interface GoalProgressBannerProps {
  soldCount: number
  goal: number | null
  now?: Date
}

export function GoalProgressBanner({ soldCount, goal, now = new Date() }: GoalProgressBannerProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const progress = calculateGoalProgress(soldCount, goal, now)
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await adminSetSiteSetting('monthly_sales_goal', String(formData.get('goal') || ''))
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-graphite p-6 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-white/70">Meta de {monthLabel}</p>
          {progress ? (
            <p className={`${anton.className} text-3xl`}>
              {soldCount} de {goal} vendas
            </p>
          ) : (
            <p className="text-lg font-bold">Nenhuma meta definida para este mês</p>
          )}
        </div>
        {progress && <p className={`${anton.className} text-4xl text-aguiar-red`}>{progress.percent}%</p>}
      </div>

      {progress && (
        <>
          <p className="text-sm text-white/70">
            Faltam {progress.remaining} em {progress.businessDaysLeft} dias úteis.
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-aguiar-red transition-all"
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
        </>
      )}

      <div>
        {editing ? (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <label htmlFor="goal" className="text-sm text-white/70">
              Meta de vendas do mês
            </label>
            <input
              id="goal"
              name="goal"
              type="number"
              min={1}
              defaultValue={goal ?? ''}
              autoFocus
              className="w-20 rounded-lg border border-white/25 bg-transparent p-1.5 text-center text-sm text-white focus:border-white focus:outline-none"
            />
            <Button type="submit" disabled={saving} className="px-4 py-1.5 text-xs">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-bold text-white/70 hover:text-white"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-bold uppercase tracking-wide text-white/70 hover:text-white"
          >
            Editar meta
          </button>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/components/admin/GoalProgressBanner.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add site/src/components/admin/GoalProgressBanner.tsx site/tests/components/admin/GoalProgressBanner.test.tsx
git commit -m "feat(painel): add GoalProgressBanner"
```

---

### Task 9: `SalesPanel` component

**Files:**
- Create: `site/src/components/admin/SalesPanel.tsx`
- Test: `site/tests/components/admin/SalesPanel.test.tsx`

**Interfaces:**
- Consumes: `resolveDateRange`, `getSalesPanelMetrics`, `DateRangePreset` (Tasks 3-4); `formatPriceFromCents` from `@/lib/format` (existing); `anton` from `@/lib/fonts`; `Vehicle` from `@/lib/types`.
- Produces: `SalesPanel({ vehicles: Vehicle[], expenseTotals: Record<string, number>, now?: Date })` — used by Task 14.

- [ ] **Step 1: Write the failing tests**

```typescript
// site/tests/components/admin/SalesPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SalesPanel } from '@/components/admin/SalesPanel'
import type { Vehicle } from '@/lib/types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2024, year_fabrication: 2024, mileage_km: 10000, price_cents: 8000000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null,
    horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null,
    fipe_value_cents: null, fipe_fetched_at: null, optionals: [],
    ...overrides,
  }
}

const NOW = new Date(2026, 8, 25)

describe('SalesPanel', () => {
  it('defaults to the "Mês" preset and shows aggregated metrics', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-10', sale_price_cents: 5000000, acquisition_cost_cents: 3000000 }),
    ]
    render(<SalesPanel vehicles={vehicles} expenseTotals={{}} now={NOW} />)
    expect(screen.getByText('Vendas')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('switches period when a preset button is clicked', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-09-25', sale_price_cents: 5000000 }),
      makeVehicle({ id: 'b', status: 'sold', sold_at: '2026-09-01', sale_price_cents: 4000000 }),
    ]
    render(<SalesPanel vehicles={vehicles} expenseTotals={{}} now={NOW} />)

    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('reveals two date inputs when "Personalizado" is selected', () => {
    render(<SalesPanel vehicles={[]} expenseTotals={{}} now={NOW} />)
    fireEvent.click(screen.getByRole('button', { name: 'Personalizado' }))
    expect(screen.getByLabelText('De')).toBeInTheDocument()
    expect(screen.getByLabelText('até')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/components/admin/SalesPanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// site/src/components/admin/SalesPanel.tsx
'use client'

import { useState } from 'react'
import type { Vehicle } from '@/lib/types'
import { resolveDateRange, getSalesPanelMetrics, type DateRangePreset } from '@/lib/dashboard'
import { formatPriceFromCents } from '@/lib/format'
import { anton } from '@/lib/fonts'

interface SalesPanelProps {
  vehicles: Vehicle[]
  expenseTotals: Record<string, number>
  now?: Date
}

const PRESETS: { value: Exclude<DateRangePreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
]

export function SalesPanel({ vehicles, expenseTotals, now = new Date() }: SalesPanelProps) {
  const [preset, setPreset] = useState<DateRangePreset>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const range =
    preset === 'custom'
      ? resolveDateRange('custom', now, { start: customStart, end: customEnd })
      : resolveDateRange(preset, now)
  const metrics = getSalesPanelMetrics(vehicles, expenseTotals, range)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Painel de vendas</h2>
        <p className="text-sm text-support-gray">Acompanhe as vendas do período</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPreset(value)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              preset === value ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreset('custom')}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
            preset === 'custom' ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
          }`}
        >
          Personalizado
        </button>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="customStart" className="text-sm text-support-gray">
            De
          </label>
          <input
            id="customStart"
            type="date"
            value={customStart}
            onChange={(event) => setCustomStart(event.target.value)}
            className="rounded-lg border border-support-gray/25 p-1.5 text-sm text-graphite"
          />
          <label htmlFor="customEnd" className="text-sm text-support-gray">
            até
          </label>
          <input
            id="customEnd"
            type="date"
            value={customEnd}
            onChange={(event) => setCustomEnd(event.target.value)}
            className="rounded-lg border border-support-gray/25 p-1.5 text-sm text-graphite"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-support-gray">Lucro</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(metrics.profitCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Faturamento</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(metrics.revenueCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Vendas</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{metrics.count}</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/components/admin/SalesPanel.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add site/src/components/admin/SalesPanel.tsx site/tests/components/admin/SalesPanel.test.tsx
git commit -m "feat(painel): add SalesPanel"
```

---

### Task 10: `StoreSnapshotCard` component

**Files:**
- Create: `site/src/components/admin/StoreSnapshotCard.tsx`
- Test: `site/tests/components/admin/StoreSnapshotCard.test.tsx`

**Interfaces:**
- Consumes: `getStoreSnapshot` (Task 5); `formatPriceFromCents`; `anton`; `Vehicle`.
- Produces: `StoreSnapshotCard({ vehicles: Vehicle[], expenseTotals: Record<string, number> })` — used by Task 14. No `'use client'` needed (pure function of props, no hooks) — same pattern as `StockAgingList`.

- [ ] **Step 1: Write the failing test**

```typescript
// site/tests/components/admin/StoreSnapshotCard.test.tsx
import { render, screen } from '@testing-library/react'
import { StoreSnapshotCard } from '@/components/admin/StoreSnapshotCard'
import type { Vehicle } from '@/lib/types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2024, year_fabrication: 2024, mileage_km: 10000, price_cents: 8000000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null,
    horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null,
    fipe_value_cents: null, fipe_fetched_at: null, optionals: [],
    ...overrides,
  }
}

describe('StoreSnapshotCard', () => {
  it('shows invested, list value and expected profit for the current stock', () => {
    const vehicles = [
      makeVehicle({ id: 'a', status: 'available', price_cents: 8000000, acquisition_cost_cents: 5000000 }),
    ]
    render(<StoreSnapshotCard vehicles={vehicles} expenseTotals={{}} />)
    expect(screen.getByText('Valor gasto no estoque')).toBeInTheDocument()
    expect(screen.getByText('Valor de venda do estoque')).toBeInTheDocument()
    expect(screen.getByText('Lucro esperado')).toBeInTheDocument()
    expect(screen.getByText('R$ 50.000')).toBeInTheDocument()
    expect(screen.getByText('R$ 80.000')).toBeInTheDocument()
    expect(screen.getByText('R$ 30.000')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd site && npx vitest run tests/components/admin/StoreSnapshotCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// site/src/components/admin/StoreSnapshotCard.tsx
import { getStoreSnapshot } from '@/lib/dashboard'
import type { Vehicle } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'
import { anton } from '@/lib/fonts'

interface StoreSnapshotCardProps {
  vehicles: Vehicle[]
  expenseTotals: Record<string, number>
}

export function StoreSnapshotCard({ vehicles, expenseTotals }: StoreSnapshotCardProps) {
  const snapshot = getStoreSnapshot(vehicles, expenseTotals)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Sua loja agora</h2>
        <p className="text-sm text-support-gray">Investimento no estoque atual</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-support-gray">Valor gasto no estoque</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(snapshot.investedCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Valor de venda do estoque</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(snapshot.listValueCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Lucro esperado</p>
          <p className={`${anton.className} text-2xl text-green-700`}>{formatPriceFromCents(snapshot.expectedProfitCents)}</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd site && npx vitest run tests/components/admin/StoreSnapshotCard.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add site/src/components/admin/StoreSnapshotCard.tsx site/tests/components/admin/StoreSnapshotCard.test.tsx
git commit -m "feat(painel): add StoreSnapshotCard"
```

---

### Task 11: Add Recharts dependency + jsdom `ResizeObserver` test polyfill

**Files:**
- Modify: `site/package.json` (adds `recharts`)
- Modify: `site/tests/setup.ts`

**Interfaces:**
- Produces: the `recharts` package importable as `from 'recharts'` in Tasks 12-13; a global `ResizeObserver` available in every Vitest test (needed because Recharts' `ResponsiveContainer` reads it, and jsdom doesn't implement it).

- [ ] **Step 1: Install the dependency**

Run: `cd site && npm install recharts --save-exact`
Expected: `recharts` added to `package.json` `dependencies` with an exact version (no `^`), matching how `next`/`react` are pinned in this project.

- [ ] **Step 2: Add the ResizeObserver polyfill to test setup**

```typescript
// site/tests/setup.ts — add below the existing next/font/google mock
// Recharts' ResponsiveContainer (used by the Painel's charts) reads
// ResizeObserver to measure its container; jsdom doesn't implement it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error -- jsdom has no ResizeObserver; Recharts only needs the shape above.
global.ResizeObserver = ResizeObserverStub
```

- [ ] **Step 3: Verify the full suite still runs clean**

Run: `cd site && npx vitest run`
Expected: PASS, same test count as before this task (no chart component tests exist yet — this task only wires up the dependency and the polyfill).

- [ ] **Step 4: Commit**

```bash
git add site/package.json site/package-lock.json site/tests/setup.ts
git commit -m "chore(painel): add recharts and a ResizeObserver test polyfill"
```

---

### Task 12: `LeadFunnelChart` component

**Files:**
- Create: `site/src/components/admin/LeadFunnelChart.tsx`
- Test: `site/tests/components/admin/LeadFunnelChart.test.tsx`

**Interfaces:**
- Consumes: `getFunnelData` (Task 6); `FunnelChart`, `Funnel`, `Cell`, `LabelList`, `Tooltip`, `ResponsiveContainer` from `recharts` (Task 11); `Lead`, `LeadStage` from `@/lib/types`.
- Produces: `LeadFunnelChart({ leads: Lead[] })` — used by Task 14.

**Note on testing Recharts:** under jsdom, `ResponsiveContainer` measures a 0×0 container (no real layout engine), so it renders no chart geometry — don't assert on SVG paths/bars. Only test the heading, the empty state, and that rendering with data doesn't throw.

- [ ] **Step 1: Write the failing tests**

```typescript
// site/tests/components/admin/LeadFunnelChart.test.tsx
import { render, screen } from '@testing-library/react'
import { LeadFunnelChart } from '@/components/admin/LeadFunnelChart'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Cliente', phone: '99999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('LeadFunnelChart', () => {
  it('shows an empty state when there are no leads in the funnel', () => {
    render(<LeadFunnelChart leads={[]} />)
    expect(screen.getByText('Nenhum cliente no funil ainda.')).toBeInTheDocument()
  })

  it('renders the chart without throwing when there are leads', () => {
    const leads = [makeLead({ id: '1', stage: 'novo' }), makeLead({ id: '2', stage: 'negociando' })]
    render(<LeadFunnelChart leads={leads} />)
    expect(screen.getByText('Funil')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum cliente no funil ainda.')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/components/admin/LeadFunnelChart.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// site/src/components/admin/LeadFunnelChart.tsx
'use client'

import { FunnelChart, Funnel, Cell, LabelList, Tooltip, ResponsiveContainer } from 'recharts'
import type { Lead, LeadStage } from '@/lib/types'
import { getFunnelData } from '@/lib/dashboard'

interface LeadFunnelChartProps {
  leads: Lead[]
}

// Solid hex fills for the funnel's SVG segments — Recharts needs literal
// colors, not Tailwind classes. Same blue/orange/yellow/pink/green already
// used by LEAD_STAGE_ACCENTS for the kanban, minus "não comprou" (not part
// of the funnel).
const FUNNEL_STAGE_COLORS: Record<Exclude<LeadStage, 'nao_comprou'>, string> = {
  novo: '#3b82f6',
  visita_marcada: '#f97316',
  negociando: '#eab308',
  ligar_de_volta: '#ec4899',
  vendeu: '#16a34a',
}

export function LeadFunnelChart({ leads }: LeadFunnelChartProps) {
  const data = getFunnelData(leads)
  const total = data.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Funil</h2>
        <p className="text-sm text-support-gray">Distribuição de clientes por etapa</p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-support-gray">Nenhum cliente no funil ainda.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="count" data={data} isAnimationActive={false}>
              <LabelList dataKey="label" position="right" fill="#111111" stroke="none" />
              {data.map((entry) => (
                <Cell key={entry.stage} fill={FUNNEL_STAGE_COLORS[entry.stage as Exclude<LeadStage, 'nao_comprou'>]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/components/admin/LeadFunnelChart.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add site/src/components/admin/LeadFunnelChart.tsx site/tests/components/admin/LeadFunnelChart.test.tsx
git commit -m "feat(painel): add LeadFunnelChart"
```

---

### Task 13: `SalesTimeSeriesChart` component

**Files:**
- Create: `site/src/components/admin/SalesTimeSeriesChart.tsx`
- Test: `site/tests/components/admin/SalesTimeSeriesChart.test.tsx`

**Interfaces:**
- Consumes: `getSalesTimeSeries`, `TimeSeriesGranularity` (Task 7); `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from `recharts`; `Vehicle`.
- Produces: `SalesTimeSeriesChart({ vehicles: Vehicle[], now?: Date })` — used by Task 14.

**Note on testing Recharts:** same caveat as Task 12 — don't assert on bar geometry, only on the period-selector buttons and headings.

- [ ] **Step 1: Write the failing tests**

```typescript
// site/tests/components/admin/SalesTimeSeriesChart.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SalesTimeSeriesChart } from '@/components/admin/SalesTimeSeriesChart'
import type { Vehicle } from '@/lib/types'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2024, year_fabrication: 2024, mileage_km: 10000, price_cents: 8000000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null,
    horsepower: null, is_featured: false, status: 'available',
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null,
    fipe_value_cents: null, fipe_fetched_at: null, optionals: [],
    ...overrides,
  }
}

describe('SalesTimeSeriesChart', () => {
  it('renders the heading and the three period options, "Últimos 7 dias" selected by default', () => {
    render(<SalesTimeSeriesChart vehicles={[]} now={new Date(2026, 8, 25)} />)
    expect(screen.getByText('Vendas ao longo do tempo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Últimos 7 dias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Últimas 4 semanas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Últimos 12 meses' })).toBeInTheDocument()
  })

  it('switches granularity when a different period button is clicked, without throwing', () => {
    const vehicles = [makeVehicle({ id: 'a', status: 'sold', sold_at: '2026-07-01' })]
    render(<SalesTimeSeriesChart vehicles={vehicles} now={new Date(2026, 8, 25)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Últimos 12 meses' }))
    expect(screen.getByText('Vendas ao longo do tempo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/components/admin/SalesTimeSeriesChart.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// site/src/components/admin/SalesTimeSeriesChart.tsx
'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Vehicle } from '@/lib/types'
import { getSalesTimeSeries, type TimeSeriesGranularity } from '@/lib/dashboard'

interface SalesTimeSeriesChartProps {
  vehicles: Vehicle[]
  now?: Date
}

const RANGE_OPTIONS: { granularity: TimeSeriesGranularity; buckets: number; label: string }[] = [
  { granularity: 'day', buckets: 7, label: 'Últimos 7 dias' },
  { granularity: 'week', buckets: 4, label: 'Últimas 4 semanas' },
  { granularity: 'month', buckets: 12, label: 'Últimos 12 meses' },
]

export function SalesTimeSeriesChart({ vehicles, now = new Date() }: SalesTimeSeriesChartProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { granularity, buckets } = RANGE_OPTIONS[selectedIndex]
  const data = getSalesTimeSeries(vehicles, granularity, buckets, now)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Vendas ao longo do tempo</h2>
          <p className="text-sm text-support-gray">Número de vendas por período</p>
        </div>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                index === selectedIndex ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="bucketLabel" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#D32027" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/components/admin/SalesTimeSeriesChart.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add site/src/components/admin/SalesTimeSeriesChart.tsx site/tests/components/admin/SalesTimeSeriesChart.test.tsx
git commit -m "feat(painel): add SalesTimeSeriesChart"
```

---

### Task 14: Wire everything into `AdminPainelPage`

**Files:**
- Modify: `site/src/app/admin/(dashboard)/page.tsx`

**Interfaces:**
- Consumes: `getAllVehiclesAdmin` (existing, `src/lib/queries/vehicles.ts`); `getAllLeadsAdmin` (existing, `src/lib/queries/leads.ts`); `getSiteSetting` (existing, `src/lib/queries/site-settings.ts`); `getVehicleExpenseTotals` (existing, `src/lib/queries/vehicle-expenses.ts`); `getLeadSummaryCounts`, `getCurrentMonthValue` (existing, `src/lib/lead-summary.ts`); `parseTurnoverThreshold`, `daysInStock` (existing, `src/lib/vehicle-stock.ts`); all six components from Tasks 8-13 plus the two already in this file (`StockTurnoverCard`, `StockAgingList`).
- Produces: the finished `/admin` page — no further tasks depend on this one.

No new automated test for this task — this codebase doesn't unit-test page-level Server Components (`tests/app/admin/` only covers `login`); the six pieces wired in here are already covered by their own component/lib tests. Verify manually per Step 3 below.

- [ ] **Step 1: Replace the page**

```tsx
// site/src/app/admin/(dashboard)/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { getVehicleExpenseTotals } from '@/lib/queries/vehicle-expenses'
import { parseTurnoverThreshold, daysInStock } from '@/lib/vehicle-stock'
import { getLeadSummaryCounts, getCurrentMonthValue } from '@/lib/lead-summary'
import { StockTurnoverCard } from '@/components/admin/StockTurnoverCard'
import { StockAgingList } from '@/components/admin/StockAgingList'
import { GoalProgressBanner } from '@/components/admin/GoalProgressBanner'
import { SalesPanel } from '@/components/admin/SalesPanel'
import { StoreSnapshotCard } from '@/components/admin/StoreSnapshotCard'
import { LeadFunnelChart } from '@/components/admin/LeadFunnelChart'
import { SalesTimeSeriesChart } from '@/components/admin/SalesTimeSeriesChart'

export default async function AdminPainelPage() {
  const client = await createServerSupabaseClient()
  const [vehicles, leads, thresholdSetting, goalSetting] = await Promise.all([
    getAllVehiclesAdmin(client),
    getAllLeadsAdmin(client),
    getSiteSetting(client, 'stock_turnover_threshold_days'),
    getSiteSetting(client, 'monthly_sales_goal'),
  ])
  const expenseTotals = await getVehicleExpenseTotals(client, vehicles.map((vehicle) => vehicle.id))

  const thresholdDays = parseTurnoverThreshold(thresholdSetting)
  const goal = goalSetting != null && goalSetting !== '' ? Number(goalSetting) : null
  const soldInCurrentMonth = getLeadSummaryCounts(leads, vehicles, getCurrentMonthValue()).soldInMonth

  const availableAged = vehicles
    .filter((vehicle) => vehicle.status === 'available')
    .map((vehicle) => ({ vehicle, days: daysInStock(vehicle) }))
    .sort((a, b) => b.days - a.days)

  const avgDays =
    availableAged.length > 0
      ? Math.round(availableAged.reduce((sum, { days }) => sum + days, 0) / availableAged.length)
      : 0
  const staleCount = availableAged.filter(({ days }) => days >= thresholdDays).length

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold uppercase">Painel</h1>

      <GoalProgressBanner soldCount={soldInCurrentMonth} goal={goal} />

      <SalesPanel vehicles={vehicles} expenseTotals={expenseTotals} />

      <StoreSnapshotCard vehicles={vehicles} expenseTotals={expenseTotals} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadFunnelChart leads={leads} />
        <StockTurnoverCard
          avgDays={avgDays}
          availableCount={availableAged.length}
          staleCount={staleCount}
          thresholdDays={thresholdDays}
        />
      </div>

      <StockAgingList
        vehicles={availableAged.slice(0, 6).map(({ vehicle, days }) => ({
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.version,
          year_model: vehicle.year_model,
          mileage_km: vehicle.mileage_km,
          price_cents: vehicle.price_cents,
          days,
        }))}
      />

      <SalesTimeSeriesChart vehicles={vehicles} />
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite and typecheck**

Run: `cd site && npx vitest run && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 3: Manually verify in the browser**

Start the dev server with sandboxing disabled (`dangerouslyDisableSandbox: true` for both the start and any `curl`/`lsof` health check — the sandboxed Bash tool can reach a server the user's real browser cannot). Port 3000 is usually taken by an unrelated process on this machine; Next.js will fall back to 3001 automatically. Open `/admin` and confirm:
- The goal banner shows the empty state (no `monthly_sales_goal` set yet from Task 1's migration), and that setting a goal via "Editar meta" persists after a refresh.
- The sales panel's period buttons change the three numbers.
- "Sua loja agora" shows non-zero numbers if any vehicle in Estoque has a cost/price set.
- The funnel renders (or shows its empty state if there are no leads).
- Giro de estoque / Carros parados look exactly as they did before this plan (regression check).
- The time-series chart renders and its period buttons switch granularity.

If a page load shows a stale-Server-Action or dnd-kit hydration error, hard-refresh (Cmd+Shift+R) before assuming it's a real bug — both are known dev-mode artifacts in this project, unrelated to this page.

- [ ] **Step 4: Commit**

```bash
git add "site/src/app/admin/(dashboard)/page.tsx"
git commit -m "feat(painel): wire goal progress, sales panel, store snapshot, funnel and time-series into /admin"
```

---

## Self-Review Notes

- **Spec coverage:** every section of the design doc (meta progress banner, sales panel with period selector, "Sua loja agora", funnel chart, existing turnover/aging widgets, time-series chart, `monthly_sales_goal` setting, Recharts addition) maps to a task above. Explicitly-deferred items (pace projection, margin-alert banner, ticket médio, holiday calendar, Faturamento/Vendas toggle, full sub-projeto 5) have no task — confirmed absent by design.
- **Type consistency:** `DateRange`, `DateRangePreset`, `GoalProgress`, `SalesPanelMetrics`, `StoreSnapshot`, `FunnelStageCount`, `TimeSeriesGranularity`, `SalesTimeSeriesPoint` are each defined once (Tasks 2-3, 4, 5, 6, 7) and consumed by name, unchanged, in every later task and in Task 14's page wiring.
- **No placeholders:** every step has full runnable code; no task says "add tests for the above" without showing them.
