# Leads Overview Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a summary layer above the existing Leads kanban board: 4 stat cards (Clientes ativos, Em negociação, Retornos atrasados, Vendas no mês), a Funil/Compradores tab split, a month filter, a colored kanban, and a renamed "Novo cliente" add-lead action.

**Architecture:** All new counting/filtering logic lives in pure, dependency-free functions in `src/lib/lead-summary.ts` (mirrors `lead-kanban.ts`/`vehicle-stock.ts`). A new orchestrating client component, `LeadsOverview.tsx`, owns the `month` and `activeTab` state and composes three presentational pieces: the existing `LeadKanbanBoard` (unchanged behavior, just recolored), a new `LeadSummaryCards`, and a new `BuyersList`. Everything is computed client-side from data fetched once in `page.tsx` — no new Supabase queries per tab/month change, matching how `VehicleStockGrid` already filters client-side over a fully-loaded list.

**Tech Stack:** Next.js 15 (App Router), React 19, Supabase, Vitest + Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-02-leads-overview-dashboard-design.md`

## Global Constraints

- Only "Vendas no mês" and the Compradores tab are affected by the month filter. "Clientes ativos", "Em negociação", and "Retornos atrasados" always reflect the current state — never scoped to a past month.
- "Retornos atrasados" = leads with `stage === 'visita_marcada'` whose `scheduled_visit_date` + `scheduled_visit_time` (missing time → treated as `23:59`, end of day) is already in the past. Build the comparison `Date` via `new Date(year, month-1, day, hour, minute)` (local-time constructor) — never `new Date(isoString)`, which rolls a date-only value back a day in timezones behind UTC (same rule already established for `formatIsoDate`).
- "Vendas no mês" and Compradores match a vehicle's `sold_at` (a `date` column, `YYYY-MM-DD` string) against the selected month (`YYYY-MM` string) by plain string prefix (`sold_at.startsWith(month)`) — no `Date` parsing, no timezone risk.
- No new icons — reuse exactly `LeadsIcon`, `AlertCircleIcon`, `ClockIcon`, `CheckCircleIcon` from `src/components/admin/icons.tsx`.
- No new color tokens — every accent reuses colors already present in the app (`support-gray`, the `yellow-100`/`yellow-800` pair already used for "Sem margem" in Estoque, the `green-50`/`green-700` pair already used for "Lucro" in Estoque, `aguiar-red`).
- The kanban's own behavior (drag-and-drop, optimistic stage updates, the sale-completion gate, delete/edit) does not change in this plan — only its column header and card border gain color.
- "+ Novo lead" becomes "Novo cliente" everywhere it appears (sidebar button, the modal's own default title, and the new button on this page) — same modal, same fields, only the text changes.
- All new components are presentational; all counting/filtering/joining logic lives in `src/lib/lead-summary.ts` and is unit-tested there, not re-derived inside components.

---

### Task 1: Summary and buyer logic (`src/lib/lead-summary.ts`)

**Files:**
- Create: `site/src/lib/lead-summary.ts`
- Test: `site/tests/lib/lead-summary.test.ts`

**Interfaces:**
- Consumes: `Lead`, `Vehicle` from `./types`.
- Produces: `interface LeadSummaryCounts { active: number; negotiating: number; overdue: number; soldInMonth: number }`, `isOverdueReturn(lead: Pick<Lead, 'stage' | 'scheduled_visit_date' | 'scheduled_visit_time'>, now?: Date): boolean`, `getLeadSummaryCounts(leads: Lead[], vehicles: Vehicle[], month: string, now?: Date): LeadSummaryCounts`, `getBuyers(leads: Lead[], vehicles: Vehicle[], month: string): { lead: Lead; vehicle: Vehicle }[]`, `getCurrentMonthValue(now?: Date): string`.

- [ ] **Step 1: Write the failing tests**

```ts
// site/tests/lib/lead-summary.test.ts
import { describe, it, expect } from 'vitest'
import { isOverdueReturn, getLeadSummaryCounts, getBuyers, getCurrentMonthValue } from '@/lib/lead-summary'
import type { Lead, Vehicle } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'fiat-argo', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2023, year_fabrication: 2023, mileage_km: 30000, price_cents: 6490000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null, horsepower: null,
    is_featured: false, status: 'sold', created_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: 6200000, sold_at: '2026-09-02', buyer_lead_id: 'l-1',
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null, fipe_value_cents: null, fipe_fetched_at: null,
    optionals: [],
    ...overrides,
  }
}

describe('isOverdueReturn', () => {
  const NOW = new Date(2026, 8, 2, 12, 0) // Sept 2, 2026, 12:00 local

  it('is true when the scheduled visit date/time already passed', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-01', scheduled_visit_time: '10:00' })
    expect(isOverdueReturn(lead, NOW)).toBe(true)
  })

  it('is false when the scheduled visit is still in the future', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-03', scheduled_visit_time: '10:00' })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })

  it('treats a missing time as end of day (23:59) — today with no time is not yet overdue', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-02', scheduled_visit_time: null })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })

  it('with a missing time, a past day is overdue', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: '2026-09-01', scheduled_visit_time: null })
    expect(isOverdueReturn(lead, NOW)).toBe(true)
  })

  it('is false for any stage other than visita_marcada, even with a past date', () => {
    const lead = makeLead({ stage: 'negociando', scheduled_visit_date: '2026-09-01', scheduled_visit_time: '10:00' })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })

  it('is false when there is no scheduled_visit_date at all', () => {
    const lead = makeLead({ stage: 'visita_marcada', scheduled_visit_date: null })
    expect(isOverdueReturn(lead, NOW)).toBe(false)
  })
})

describe('getLeadSummaryCounts', () => {
  const NOW = new Date(2026, 8, 2, 12, 0)

  it('counts active, negotiating, overdue, and sold-in-month independently', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'novo' }),
      makeLead({ id: 'b', stage: 'negociando' }),
      makeLead({ id: 'c', stage: 'visita_marcada', scheduled_visit_date: '2026-09-01', scheduled_visit_time: '10:00' }),
      makeLead({ id: 'd', stage: 'vendeu' }),
      makeLead({ id: 'e', stage: 'nao_comprou' }),
    ]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' }), makeVehicle({ id: 'v-2', sold_at: '2026-08-15' })]

    expect(getLeadSummaryCounts(leads, vehicles, '2026-09', NOW)).toEqual({
      active: 3, // a, b, c (not d=vendeu or e=nao_comprou)
      negotiating: 1, // b
      overdue: 1, // c
      soldInMonth: 1, // only v-1 sold in September
    })
  })

  it('soldInMonth is the only count affected by a different month', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' })]
    const vehicles = [makeVehicle({ sold_at: '2026-08-15' })]

    expect(getLeadSummaryCounts(leads, vehicles, '2026-08', NOW).soldInMonth).toBe(1)
    expect(getLeadSummaryCounts(leads, vehicles, '2026-01', NOW).soldInMonth).toBe(0)
    expect(getLeadSummaryCounts(leads, vehicles, '2026-01', NOW).active).toBe(1)
  })
})

describe('getBuyers', () => {
  it('matches a "vendeu" lead to its vehicle when the sale falls in the given month', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([{ lead: leads[0], vehicle: vehicles[0] }])
  })

  it('excludes a sale outside the given month', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-08-15' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([])
  })

  it('excludes a lead not at the "vendeu" stage', () => {
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([])
  })

  it('excludes a "vendeu" lead with no linked vehicle', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: null })]
    const vehicles = [makeVehicle({ id: 'v-1', sold_at: '2026-09-02' })]
    expect(getBuyers(leads, vehicles, '2026-09')).toEqual([])
  })
})

describe('getCurrentMonthValue', () => {
  it('formats as YYYY-MM, zero-padded', () => {
    expect(getCurrentMonthValue(new Date(2026, 0, 15))).toBe('2026-01')
    expect(getCurrentMonthValue(new Date(2026, 8, 15))).toBe('2026-09')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/lead-summary.test.ts`
Expected: FAIL — `Cannot find module '@/lib/lead-summary'`.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/lib/lead-summary.ts
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
    soldInMonth: vehicles.filter((vehicle) => vehicle.sold_at?.startsWith(month)).length,
  }
}

/** Leads that reached "vendeu" whose linked vehicle sold within `month` (YYYY-MM). */
export function getBuyers(leads: Lead[], vehicles: Vehicle[], month: string): { lead: Lead; vehicle: Vehicle }[] {
  const buyers: { lead: Lead; vehicle: Vehicle }[] = []
  for (const lead of leads) {
    if (lead.stage !== 'vendeu' || !lead.vehicle_id) continue
    const vehicle = vehicles.find((candidate) => candidate.id === lead.vehicle_id)
    if (vehicle?.sold_at?.startsWith(month)) buyers.push({ lead, vehicle })
  }
  return buyers
}

/** Current month as `YYYY-MM`, for the filter's default value. */
export function getCurrentMonthValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/lead-summary.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/lead-summary.ts tests/lib/lead-summary.test.ts
git commit -m "feat(leads): add summary counts and buyers-list logic"
```

---

### Task 2: `LeadSummaryCards.tsx`

**Files:**
- Create: `site/src/components/admin/LeadSummaryCards.tsx`
- Test: `site/tests/components/admin/LeadSummaryCards.test.tsx`

**Interfaces:**
- Consumes: `LeadsIcon`, `AlertCircleIcon`, `ClockIcon`, `CheckCircleIcon` from `./icons`; `anton` from `@/lib/fonts`.
- Produces: `LeadSummaryCards({ activeCount, negotiatingCount, overdueCount, soldCount }): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
// site/tests/components/admin/LeadSummaryCards.test.tsx
import { render, screen } from '@testing-library/react'
import { LeadSummaryCards } from '@/components/admin/LeadSummaryCards'

describe('LeadSummaryCards', () => {
  it('shows all four counts with their labels', () => {
    render(<LeadSummaryCards activeCount={12} negotiatingCount={3} overdueCount={2} soldCount={5} />)
    expect(screen.getByText('Clientes ativos')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Em negociação')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Retornos atrasados')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Vendas no mês')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/LeadSummaryCards.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/LeadSummaryCards'`.

- [ ] **Step 3: Write the implementation**

```tsx
// site/src/components/admin/LeadSummaryCards.tsx
import { LeadsIcon, AlertCircleIcon, ClockIcon, CheckCircleIcon } from './icons'
import { anton } from '@/lib/fonts'

interface LeadSummaryCardsProps {
  activeCount: number
  negotiatingCount: number
  overdueCount: number
  soldCount: number
}

export function LeadSummaryCards({ activeCount, negotiatingCount, overdueCount, soldCount }: LeadSummaryCardsProps) {
  const stats = [
    { label: 'Clientes ativos', value: activeCount, Icon: LeadsIcon, chip: 'bg-support-gray/10 text-support-gray' },
    { label: 'Em negociação', value: negotiatingCount, Icon: AlertCircleIcon, chip: 'bg-yellow-100 text-yellow-800' },
    { label: 'Retornos atrasados', value: overdueCount, Icon: ClockIcon, chip: 'bg-aguiar-red/10 text-aguiar-red' },
    { label: 'Vendas no mês', value: soldCount, Icon: CheckCircleIcon, chip: 'bg-green-50 text-green-700' },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, Icon, chip }) => (
        <div key={label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${chip}`}>
            <Icon />
          </span>
          <div>
            <p className="text-sm text-support-gray">{label}</p>
            <p className={`${anton.className} text-3xl leading-none text-graphite`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/LeadSummaryCards.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/LeadSummaryCards.tsx tests/components/admin/LeadSummaryCards.test.tsx
git commit -m "feat(leads): add LeadSummaryCards"
```

---

### Task 3: `BuyersList.tsx`

**Files:**
- Create: `site/src/components/admin/BuyersList.tsx`
- Test: `site/tests/components/admin/BuyersList.test.tsx`

**Interfaces:**
- Consumes: `Lead`, `Vehicle` from `@/lib/types`; `formatPriceFromCents` from `@/lib/format`; `formatIsoDate` from `@/lib/lead-kanban`.
- Produces: `BuyersList({ buyers }): JSX.Element` where `buyers: { lead: Lead; vehicle: Vehicle }[]` (already filtered/joined by `getBuyers`, Task 1).

- [ ] **Step 1: Write the failing tests**

```tsx
// site/tests/components/admin/BuyersList.test.tsx
import { render, screen } from '@testing-library/react'
import { BuyersList } from '@/components/admin/BuyersList'
import type { Lead, Vehicle } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: 'v-1', stage: 'vendeu', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'fiat-argo', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2023, year_fabrication: 2023, mileage_km: 30000, price_cents: 6490000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null, horsepower: null,
    is_featured: false, status: 'sold', created_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: 6200000, sold_at: '2026-09-02', buyer_lead_id: 'l-1',
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null, fipe_value_cents: null, fipe_fetched_at: null,
    optionals: [],
    ...overrides,
  }
}

describe('BuyersList', () => {
  it('shows the empty state when there are no buyers', () => {
    render(<BuyersList buyers={[]} />)
    expect(screen.getByText('Nenhuma venda neste mês.')).toBeInTheDocument()
  })

  it('lists each buyer with their vehicle, sale price, and date', () => {
    render(<BuyersList buyers={[{ lead: makeLead(), vehicle: makeVehicle() }]} />)
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('98999999999')).toBeInTheDocument()
    expect(screen.getByText(/Fiat Argo Drive/)).toBeInTheDocument()
    expect(screen.getByText('R$ 62.000')).toBeInTheDocument()
    expect(screen.getByText('02/09/2026')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/BuyersList.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/BuyersList'`.

- [ ] **Step 3: Write the implementation**

```tsx
// site/src/components/admin/BuyersList.tsx
import type { Lead, Vehicle } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'
import { formatIsoDate } from '@/lib/lead-kanban'

interface BuyersListProps {
  buyers: { lead: Lead; vehicle: Vehicle }[]
}

export function BuyersList({ buyers }: BuyersListProps) {
  if (buyers.length === 0) {
    return <p className="text-support-gray">Nenhuma venda neste mês.</p>
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-support-gray">
          <th className="py-2">Cliente</th>
          <th>Telefone</th>
          <th>Veículo</th>
          <th>Valor da venda</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {buyers.map(({ lead, vehicle }) => (
          <tr key={lead.id} className="border-b border-support-gray/40">
            <td className="py-2">{lead.name}</td>
            <td>{lead.phone}</td>
            <td>{vehicle.brand} {vehicle.model} {vehicle.version ?? ''}</td>
            <td>{formatPriceFromCents(vehicle.sale_price_cents ?? 0)}</td>
            <td>{vehicle.sold_at ? formatIsoDate(vehicle.sold_at) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/BuyersList.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/BuyersList.tsx tests/components/admin/BuyersList.test.tsx
git commit -m "feat(leads): add BuyersList"
```

---

### Task 4: Stage accent colors (`src/lib/lead-kanban.ts`)

**Files:**
- Modify: `site/src/lib/lead-kanban.ts`
- Test: `site/tests/lib/lead-kanban.test.ts`

**Interfaces:**
- Produces: `interface LeadStageAccent { headerBg: string; headerText: string; cardBorder: string }`, `LEAD_STAGE_ACCENTS: Record<LeadStage, LeadStageAccent>`.

- [ ] **Step 1: Write the failing test**

In `site/tests/lib/lead-kanban.test.ts`, replace the top import line:

```ts
import {
  LEAD_STAGES, LEAD_STAGE_LABELS, groupLeadsByStage, requiresSaleCompletion, buildWhatsAppLink, formatIsoDate,
} from '@/lib/lead-kanban'
```

with:

```ts
import {
  LEAD_STAGES, LEAD_STAGE_LABELS, LEAD_STAGE_ACCENTS, groupLeadsByStage, requiresSaleCompletion, buildWhatsAppLink, formatIsoDate,
} from '@/lib/lead-kanban'
```

Then append to the end of the file:

```ts
describe('LEAD_STAGE_ACCENTS', () => {
  it('has a complete accent (header background, header text, card border) for every stage', () => {
    for (const stage of LEAD_STAGES) {
      const accent = LEAD_STAGE_ACCENTS[stage]
      expect(accent).toBeDefined()
      expect(accent.headerBg).toMatch(/^bg-/)
      expect(accent.headerText).toMatch(/^text-/)
      expect(accent.cardBorder).toMatch(/^border-/)
    }
  })

  it('gives "vendeu" the same green already used for profit/success elsewhere in the app', () => {
    expect(LEAD_STAGE_ACCENTS.vendeu.headerBg).toBe('bg-green-50')
    expect(LEAD_STAGE_ACCENTS.vendeu.headerText).toBe('text-green-700')
  })

  it('gives "nao_comprou" the brand red', () => {
    expect(LEAD_STAGE_ACCENTS.nao_comprou.headerText).toBe('text-aguiar-red')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/lead-kanban.test.ts`
Expected: FAIL — `LEAD_STAGE_ACCENTS` not exported.

- [ ] **Step 3: Write the implementation**

Append to `site/src/lib/lead-kanban.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/lead-kanban.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lead-kanban.ts tests/lib/lead-kanban.test.ts
git commit -m "feat(leads): add per-stage accent colors"
```

---

### Task 5: Apply accent colors to `LeadCard.tsx` and `LeadKanbanBoard.tsx`

**Files:**
- Modify: `site/src/components/admin/LeadCard.tsx:53`
- Modify: `site/src/components/admin/LeadKanbanBoard.tsx:32-33`
- Test: `site/tests/components/admin/LeadCard.test.tsx`
- Test: `site/tests/components/admin/LeadKanbanBoard.test.tsx`

**Interfaces:**
- Consumes: `LEAD_STAGE_ACCENTS` from `@/lib/lead-kanban` (Task 4).

- [ ] **Step 1: Write the failing tests**

Append to `site/tests/components/admin/LeadCard.test.tsx`:

```tsx
it('shows a colored left border matching the stage accent', () => {
  const { container } = renderCard(makeLead({ stage: 'vendeu' }))
  expect(container.firstChild).toHaveClass('border-green-600')
})
```

Append to `site/tests/components/admin/LeadKanbanBoard.test.tsx`:

```tsx
it('applies the stage accent color to each column header', () => {
  const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: null })]
  render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)
  const heading = screen.getByText('Vendeu')
  expect(heading).toHaveClass('text-green-700')
  expect(heading.parentElement).toHaveClass('bg-green-50')
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/LeadCard.test.tsx tests/components/admin/LeadKanbanBoard.test.tsx`
Expected: FAIL — neither element has the expected class yet.

- [ ] **Step 3: Write the implementation**

In `site/src/components/admin/LeadCard.tsx`, replace:

```tsx
import { LEAD_STAGES, LEAD_STAGE_LABELS, buildWhatsAppLink, formatIsoDate } from '@/lib/lead-kanban'
```

with:

```tsx
import { LEAD_STAGES, LEAD_STAGE_LABELS, LEAD_STAGE_ACCENTS, buildWhatsAppLink, formatIsoDate } from '@/lib/lead-kanban'
```

Inside the component body, after `const vehicle = vehicles.find(...)`:

```tsx
  const accent = LEAD_STAGE_ACCENTS[lead.stage]
```

Replace:

```tsx
      className={`flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm ${isDragging ? 'opacity-50' : ''}`}
```

with:

```tsx
      className={`flex flex-col gap-2 rounded-xl border-l-4 bg-white p-4 shadow-sm ${accent.cardBorder} ${isDragging ? 'opacity-50' : ''}`}
```

In `site/src/components/admin/LeadKanbanBoard.tsx`, replace:

```tsx
import { LEAD_STAGES, LEAD_STAGE_LABELS, groupLeadsByStage, requiresSaleCompletion } from '@/lib/lead-kanban'
```

with:

```tsx
import { LEAD_STAGES, LEAD_STAGE_LABELS, LEAD_STAGE_ACCENTS, groupLeadsByStage, requiresSaleCompletion } from '@/lib/lead-kanban'
```

Then inside `LeadKanbanColumn`, after the `useDroppable` call:

```tsx
  const accent = LEAD_STAGE_ACCENTS[stage]
```

Replace:

```tsx
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-graphite">{LEAD_STAGE_LABELS[stage]}</h2>
```

with:

```tsx
      <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${accent.headerBg}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wide ${accent.headerText}`}>{LEAD_STAGE_LABELS[stage]}</h2>
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/LeadCard.test.tsx tests/components/admin/LeadKanbanBoard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `cd site && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/LeadCard.tsx src/components/admin/LeadKanbanBoard.tsx tests/components/admin/LeadCard.test.tsx tests/components/admin/LeadKanbanBoard.test.tsx
git commit -m "feat(leads): color the kanban by stage accent"
```

---

### Task 6: Rename "+ Novo lead" to "Novo cliente"

**Files:**
- Modify: `site/src/components/admin/AdminSidebar.tsx:56`
- Modify: `site/src/components/admin/LeadQuickAddModal.tsx:50`
- Modify: `site/tests/components/admin/AdminSidebar.test.tsx`

**Interfaces:** none new — pure text change.

- [ ] **Step 1: Update the failing/now-mismatched assertions**

In `site/tests/components/admin/AdminSidebar.test.tsx`, replace every occurrence of `/novo lead/i` with `/novo cliente/i` (three occurrences, all inside the `'opens the new-lead modal as the quick action, not a vehicle form'` test):

```ts
    expect(screen.queryByText(/novo cliente/i)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /novo cliente/i }))
    expect(screen.getByRole('dialog', { name: /novo cliente/i })).toBeInTheDocument()
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/AdminSidebar.test.tsx`
Expected: FAIL — the button still says "Novo lead" and the modal's default title is still "Novo lead".

- [ ] **Step 3: Rename the button and the modal's default title**

In `site/src/components/admin/AdminSidebar.tsx`, replace:

```tsx
        + Novo lead
```

with:

```tsx
        + Novo cliente
```

In `site/src/components/admin/LeadQuickAddModal.tsx`, replace:

```tsx
  const modalTitle = title ?? (lead ? 'Editar lead' : 'Novo lead')
```

with:

```tsx
  const modalTitle = title ?? (lead ? 'Editar lead' : 'Novo cliente')
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/AdminSidebar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `cd site && npm test`
Expected: PASS (no other test asserts on the literal string "Novo lead" — `LeadQuickAddModal.test.tsx` doesn't check the create-mode title text, and `VehicleSummaryPanel.tsx`'s usage always passes an explicit `title="Registrar cliente / negociação"`, unaffected by this default-string change).

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx src/components/admin/LeadQuickAddModal.tsx tests/components/admin/AdminSidebar.test.tsx
git commit -m "feat(leads): rename Novo lead to Novo cliente everywhere"
```

---

### Task 7: `LeadsOverview.tsx`

**Files:**
- Create: `site/src/components/admin/LeadsOverview.tsx`
- Test: `site/tests/components/admin/LeadsOverview.test.tsx`

**Interfaces:**
- Consumes: `Lead`, `Vehicle` from `@/lib/types`; `VehicleOption` from `@/lib/queries/vehicles`; `getLeadSummaryCounts`, `getBuyers`, `getCurrentMonthValue` from `@/lib/lead-summary` (Task 1); `LeadSummaryCards` (Task 2); `BuyersList` (Task 3); `LeadKanbanBoard` (unchanged interface); `LeadQuickAddModal` (unchanged interface, now defaults to "Novo cliente" per Task 6).
- Produces: `LeadsOverview({ leads, vehicles, vehicleOptions }): JSX.Element`.

- [ ] **Step 1: Write the failing tests**

```tsx
// site/tests/components/admin/LeadsOverview.test.tsx
import { render, screen, fireEvent, within } from '@testing-library/react'
import { vi } from 'vitest'

const { adminUpdateLeadStage, adminDeleteLead, adminCreateManualLead, adminUpdateLead } = vi.hoisted(() => ({
  adminUpdateLeadStage: vi.fn(),
  adminDeleteLead: vi.fn(),
  adminCreateManualLead: vi.fn(),
  adminUpdateLead: vi.fn(),
}))
vi.mock('@/app/actions/leads', () => ({ adminUpdateLeadStage, adminDeleteLead, adminCreateManualLead, adminUpdateLead }))

const { adminMarkVehicleSold } = vi.hoisted(() => ({ adminMarkVehicleSold: vi.fn() }))
vi.mock('@/app/actions/vehicles', () => ({ adminMarkVehicleSold }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { LeadsOverview } from '@/components/admin/LeadsOverview'
import { getCurrentMonthValue } from '@/lib/lead-summary'
import type { Lead, Vehicle } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1', slug: 'fiat-argo', brand: 'Fiat', model: 'Argo', version: 'Drive',
    year_model: 2023, year_fabrication: 2023, mileage_km: 30000, price_cents: 6490000,
    fuel_type: null, transmission: null, color: null, description: null, engine: null,
    fuel_tank_liters: null, seating_capacity: null, body_type: null, doors: null, horsepower: null,
    is_featured: false, status: 'sold', created_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-01T00:00:00.000Z',
    plate: null, acquired_at: null, acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: 6200000, sold_at: '2026-09-02', buyer_lead_id: 'l-1',
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null, fipe_value_cents: null, fipe_fetched_at: null,
    optionals: [],
    ...overrides,
  }
}

const VEHICLE_OPTIONS = [{ id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', status: 'sold' as const, price_cents: 6490000 }]

describe('LeadsOverview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the summary cards with counts derived from the leads and vehicles', () => {
    const leads = [
      makeLead({ id: 'a', stage: 'novo' }),
      makeLead({ id: 'b', stage: 'negociando' }),
      makeLead({ id: 'c', stage: 'vendeu', vehicle_id: 'v-1' }),
    ]
    const vehicles = [makeVehicle({ sold_at: `${getCurrentMonthValue()}-02` })]
    render(<LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={VEHICLE_OPTIONS} />)

    const activeCard = screen.getByText('Clientes ativos').closest('div') as HTMLElement
    expect(within(activeCard).getByText('2')).toBeInTheDocument()

    const negotiatingCard = screen.getByText('Em negociação').closest('div') as HTMLElement
    expect(within(negotiatingCard).getByText('1')).toBeInTheDocument()

    const soldCard = screen.getByText('Vendas no mês').closest('div') as HTMLElement
    expect(within(soldCard).getByText('1')).toBeInTheDocument()
  })

  it('shows the Funil (kanban) tab by default', () => {
    render(<LeadsOverview leads={[makeLead()]} vehicles={[]} vehicleOptions={VEHICLE_OPTIONS} />)
    expect(screen.getByText('Lead novo')).toBeInTheDocument()
  })

  it('switches to the Compradores tab and shows the buyers list', () => {
    const leads = [makeLead({ id: 'a', stage: 'vendeu', vehicle_id: 'v-1' })]
    const vehicles = [makeVehicle({ sold_at: `${getCurrentMonthValue()}-02` })]
    render(<LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={VEHICLE_OPTIONS} />)

    fireEvent.click(screen.getByRole('button', { name: 'Compradores' }))
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.queryByText('Lead novo')).not.toBeInTheDocument()
  })

  it('changing the month updates "Vendas no mês" without changing "Clientes ativos"', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' })]
    const vehicles = [makeVehicle({ sold_at: '2026-08-15' })]
    render(<LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={VEHICLE_OPTIONS} />)

    fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2026-08' } })
    const soldCard = screen.getByText('Vendas no mês').closest('div') as HTMLElement
    expect(within(soldCard).getByText('1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '2026-01' } })
    const soldCardAfter = screen.getByText('Vendas no mês').closest('div') as HTMLElement
    expect(within(soldCardAfter).getByText('0')).toBeInTheDocument()

    const activeCard = screen.getByText('Clientes ativos').closest('div') as HTMLElement
    expect(within(activeCard).getByText('1')).toBeInTheDocument()
  })

  it('opens the "Novo cliente" modal', () => {
    render(<LeadsOverview leads={[]} vehicles={[]} vehicleOptions={VEHICLE_OPTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: /novo cliente/i }))
    expect(screen.getByRole('dialog', { name: /novo cliente/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/LeadsOverview.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/LeadsOverview'`.

- [ ] **Step 3: Write the implementation**

```tsx
// site/src/components/admin/LeadsOverview.tsx
'use client'

import { useState } from 'react'
import type { Lead, Vehicle } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { getLeadSummaryCounts, getBuyers, getCurrentMonthValue } from '@/lib/lead-summary'
import { LeadSummaryCards } from './LeadSummaryCards'
import { LeadKanbanBoard } from './LeadKanbanBoard'
import { BuyersList } from './BuyersList'
import { LeadQuickAddModal } from './LeadQuickAddModal'

interface LeadsOverviewProps {
  leads: Lead[]
  vehicles: Vehicle[]
  vehicleOptions: VehicleOption[]
}

type LeadsTab = 'funil' | 'compradores'

const TABS: { value: LeadsTab; label: string }[] = [
  { value: 'funil', label: 'Funil' },
  { value: 'compradores', label: 'Compradores' },
]

export function LeadsOverview({ leads, vehicles, vehicleOptions }: LeadsOverviewProps) {
  const [month, setMonth] = useState(() => getCurrentMonthValue())
  const [activeTab, setActiveTab] = useState<LeadsTab>('funil')
  const [showLeadModal, setShowLeadModal] = useState(false)

  const counts = getLeadSummaryCounts(leads, vehicles, month)
  const buyers = getBuyers(leads, vehicles, month)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold uppercase">Leads</h1>
        <button
          type="button"
          onClick={() => setShowLeadModal(true)}
          className="rounded-lg bg-aguiar-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          + Novo cliente
        </button>
      </div>

      <LeadSummaryCards
        activeCount={counts.active}
        negotiatingCount={counts.negotiating}
        overdueCount={counts.overdue}
        soldCount={counts.soldInMonth}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab.value
                  ? 'border-graphite bg-graphite text-white'
                  : 'border-support-gray/25 text-graphite hover:border-graphite'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm font-bold text-graphite">
          Mês
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-lg border border-support-gray/25 px-3 py-1.5 text-sm text-graphite focus:border-aguiar-red focus:outline-none"
          />
        </label>
      </div>

      {activeTab === 'funil' ? (
        <LeadKanbanBoard leads={leads} vehicles={vehicleOptions} />
      ) : (
        <BuyersList buyers={buyers} />
      )}

      {showLeadModal && <LeadQuickAddModal vehicles={vehicleOptions} onClose={() => setShowLeadModal(false)} />}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/LeadsOverview.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/LeadsOverview.tsx tests/components/admin/LeadsOverview.test.tsx
git commit -m "feat(leads): add LeadsOverview with tabs, summary cards, and month filter"
```

---

### Task 8: Wire `LeadsOverview` into `/admin/leads`

**Files:**
- Modify: `site/src/app/admin/(dashboard)/leads/page.tsx`

**Interfaces:**
- Consumes: `getAllVehiclesAdmin` from `@/lib/queries/vehicles` (already exists, used today by the Estoque grade); `getAllLeadsAdmin`, `getVehicleOptionsAdmin` (unchanged); `LeadsOverview` (Task 7).

- [ ] **Step 1: Replace the page**

Replace the full contents of `site/src/app/admin/(dashboard)/leads/page.tsx`:

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getAllVehiclesAdmin, getVehicleOptionsAdmin } from '@/lib/queries/vehicles'
import { LeadsOverview } from '@/components/admin/LeadsOverview'

export default async function AdminLeadsPage() {
  const client = await createServerSupabaseClient()
  const [leads, vehicles, vehicleOptions] = await Promise.all([
    getAllLeadsAdmin(client),
    getAllVehiclesAdmin(client),
    getVehicleOptionsAdmin(client),
  ])

  return <LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={vehicleOptions} />
}
```

Note: the old `leads.length === 0` early return (showing "Nenhum lead recebido ainda.") is intentionally removed — the summary cards, tabs, and filter should always render, even with zero leads (the cards just show `0`, the Funil tab shows 6 empty columns, and Compradores shows its own "Nenhuma venda neste mês." empty state).

- [ ] **Step 2: Verify the project still typechecks**

Run: `cd site && npx tsc --noEmit 2>&1 | grep -v '\.test\.' | grep -c 'error TS'`
Expected: `0` (this project has a known, pre-existing tsc issue confined entirely to `.test.` files — unrelated, do not investigate it here).

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(dashboard)/leads/page.tsx"
git commit -m "feat(leads): wire LeadsOverview into /admin/leads"
```

---

### Task 9: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd site && npm test`
Expected: PASS — every test file in the project, old and new, green.

- [ ] **Step 2: Typecheck non-test source**

Run: `cd site && npx tsc --noEmit 2>&1 | grep -v '\.test\.' | grep -c 'error TS'`
Expected: `0`.

- [ ] **Step 3: Production build**

Run: `cd site && npm run build`
Expected: succeeds, including `/admin/leads` in the route table (this also confirms Next's own build-time type-check, which excludes `tests/`, is clean).

- [ ] **Step 4: Manual smoke test**

Run: `cd site && npm run dev`, open `/admin/leads` in a browser logged in as admin. Confirm: the 4 summary cards show plausible numbers; "Funil" tab shows the colored kanban (each column's header tinted, each card with a matching left border); switching to "Compradores" shows the buyer list (or its empty state); changing the month updates "Vendas no mês" and the Compradores list but not the other three cards; "+ Novo cliente" (both in the sidebar and on this page) opens the same modal titled "Novo cliente"; the kanban's drag-and-drop, menu, edit, delete, and sale-completion flow (all built in the previous plan) still work exactly as before.

No commit for this task — it's a verification pass over Tasks 1–8's work, already committed.
