# Estoque v2 (sub-projeto 1/6 do sistema interno) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the existing admin vehicle management (Next.js 15 + Supabase, `site/`) acquisition cost, per-vehicle expenses, calculated margin, minimum sale price, sale-time data capture, FIPE reference pricing, a fixed equipment/optionals catalog, a third "Em preparação" status, an acquisition date for stock-turnover tracking, and an editable turnover threshold — plus a card-grid Estoque listing to replace the current row list — all without leaking any financial/internal data to the public site.

**Architecture:** Additive migration on `vehicles` plus a new `vehicle_expenses` table. Pure calculation logic (margin, days-in-stock, grid filters) lives in dependency-free `src/lib/*.ts` modules so it's trivially unit-testable. FIPE access goes through `src/lib/fipe.ts` behind four auth-guarded route handlers (mirrors `/api/admin/placas`). New UI is small, single-purpose client components (`VehicleExpensesEditor`, `VehicleFipeSection`, `VehicleOptionalsPicker`, `VehicleSaleForm`, `VehicleStockCard`, `VehicleStockGrid`) composed into `VehicleForm` and a new grid that replaces `VehicleTable`.

**Tech Stack:** Next.js 15 (App Router), React 19, Supabase (Postgres + Auth), Zod, Vitest + Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-01-sistema-estoque-design.md`

## Global Constraints

- None of the new columns (`acquired_at`, `acquisition_cost_cents`, `min_sale_price_cents`, `sale_price_cents`, `sold_at`, `buyer_lead_id`, `fipe_brand_code`, `fipe_model_code`, `fipe_year_code`, `fipe_value_cents`, `fipe_fetched_at`, `optionals`) may ever be added to the `vehicles_public` view or otherwise reach the public site.
- `vehicles.status` grows from `'available' | 'sold'` to `'available' | 'preparing' | 'sold'`. Every public query already filters `.eq('status', 'available')`, so `preparing` needs no extra filtering anywhere.
- Câmbio/Combustível dropdowns use the **existing** `TRANSMISSION_OPTIONS`/`FUEL_TYPE_OPTIONS` exported from `src/lib/normalize.ts` — do not invent a new canonical list.
- FIPE provider is **parallelum** (`https://parallelum.com.br/fipe/api/v1/carros`).
- No test may depend on network access — mock `global.fetch` and the Supabase client in every test, matching the existing `tests/lib/apiplacas.test.ts` / `tests/app/api/admin/placas.test.ts` pattern.
- `vehicle_expenses` writes go through the same delete-then-reinsert-on-save pattern already used for `vehicle_images` in `saveVehicle` — no separate CRUD action for individual expenses.
- Money is always stored/passed as integer cents; forms convert to/from reais strings at the UI boundary only (existing `priceReais`/`priceCents` convention).
- Every new/modified server action re-checks auth via `assertAdmin` (existing `src/lib/actions/assert-admin.ts`) — RLS is defense in depth, not the only guard.
- The stock-turnover threshold (default 90 days) is a `site_settings` row (`stock_turnover_threshold_days`), never a hardcoded constant — it must be editable from Configurações.
- This plan builds working, tested functionality with existing Tailwind conventions (`inputClass`/`labelClass`, `graphite`/`aguiar-red`/`card-gray`/`support-gray` tokens, `rounded-xl bg-white p-6 shadow-sm` cards). It does **not** attempt pixel-perfect matching to the reference mockup images — that is a deliberate follow-up visual-polish pass after this plan lands (see "After all tasks").

---

### Task 1: Migration — vehicle costs, sale capture, FIPE cache, optionals, preparing status

**Files:**
- Create: `site/supabase/migrations/0005_vehicle_costs_sales_fipe_optionals.sql`

**Interfaces:**
- Produces: enum value `vehicle_status.preparing`; columns `vehicles.acquired_at`, `vehicles.acquisition_cost_cents`, `vehicles.min_sale_price_cents`, `vehicles.sale_price_cents`, `vehicles.sold_at`, `vehicles.buyer_lead_id`, `vehicles.fipe_brand_code`, `vehicles.fipe_model_code`, `vehicles.fipe_year_code`, `vehicles.fipe_value_cents`, `vehicles.fipe_fetched_at`, `vehicles.optionals`; table `vehicle_expenses(id, vehicle_id, category, description, amount_cents, created_at)`; `site_settings` row `stock_turnover_threshold_days` = `'90'`.

- [ ] **Step 1: Write the migration**

```sql
-- These columns are deliberately never added to `vehicles_public` — they're
-- financial/internal data and must never reach the public site.
alter type vehicle_status add value if not exists 'preparing';

alter table vehicles
  add column acquired_at date,
  add column acquisition_cost_cents integer,
  add column min_sale_price_cents integer,
  add column sale_price_cents integer,
  add column sold_at date,
  add column buyer_lead_id uuid references leads(id) on delete set null,
  add column fipe_brand_code text,
  add column fipe_model_code text,
  add column fipe_year_code text,
  add column fipe_value_cents integer,
  add column fipe_fetched_at timestamptz,
  add column optionals text[] not null default '{}';

create table vehicle_expenses (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  category text not null check (category in (
    'pintura', 'lavagem_higienizacao', 'mecanica', 'documentacao', 'funilaria', 'outros'
  )),
  description text,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

create index vehicle_expenses_vehicle_id_idx on vehicle_expenses(vehicle_id);

alter table vehicle_expenses enable row level security;

create policy "admin full access to vehicle_expenses" on vehicle_expenses
  for all to authenticated using (true) with check (true);

-- Editable from Configurações — never hardcoded in the app.
insert into site_settings (key, value) values ('stock_turnover_threshold_days', '90')
  on conflict (key) do nothing;
```

- [ ] **Step 2: Apply it locally and confirm it runs clean**

Run: `cd site && npx supabase start` (if not already running) or `npx supabase db reset` (if already running, to reapply all migrations from scratch).
Expected: no errors; `vehicle_expenses` exists, `vehicles` has the new columns, `site_settings` has the new row. Spot-check with:
`npx supabase db execute --local "select value from site_settings where key = 'stock_turnover_threshold_days'"` (or open the local Studio at the URL printed by `supabase start`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0005_vehicle_costs_sales_fipe_optionals.sql
git commit -m "feat(db): add vehicle cost/sale/FIPE/optionals columns, preparing status, turnover setting"
```

---

### Task 2: Types (`src/lib/types.ts`)

**Files:**
- Modify: `site/src/lib/types.ts`

**Interfaces:**
- Produces: `VehicleStatus` extended with `'preparing'`; type `VehicleExpenseCategory`; interface `VehicleExpense`; extended `Vehicle` interface.

- [ ] **Step 1: Update `VehicleStatus` and add the expense types**

Replace the existing `VehicleStatus` line:

```ts
export type VehicleStatus = 'available' | 'preparing' | 'sold'
```

Add near the other domain types (after `VehicleStatus`):

```ts
export type VehicleExpenseCategory =
  | 'pintura'
  | 'lavagem_higienizacao'
  | 'mecanica'
  | 'documentacao'
  | 'funilaria'
  | 'outros'

export interface VehicleExpense {
  id: string
  vehicle_id: string
  category: VehicleExpenseCategory
  description: string | null
  amount_cents: number
  created_at: string
}
```

- [ ] **Step 2: Extend the `Vehicle` interface**

Replace:

```ts
export interface Vehicle extends VehiclePublic {
  plate: string | null
}
```

with:

```ts
export interface Vehicle extends VehiclePublic {
  plate: string | null
  acquired_at: string | null
  acquisition_cost_cents: number | null
  min_sale_price_cents: number | null
  sale_price_cents: number | null
  sold_at: string | null
  buyer_lead_id: string | null
  fipe_brand_code: string | null
  fipe_model_code: string | null
  fipe_year_code: string | null
  fipe_value_cents: number | null
  fipe_fetched_at: string | null
  optionals: string[]
}
```

- [ ] **Step 3: Verify the project still typechecks**

Run: `cd site && npx tsc --noEmit`
Expected: PASS (this task only widens types; nothing consumes the new fields yet).

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(estoque): extend Vehicle types with costs, FIPE, optionals, preparing status"
```

---

### Task 3: Margin calculation (`src/lib/vehicle-costs.ts`)

**Files:**
- Create: `site/src/lib/vehicle-costs.ts`
- Test: `site/tests/lib/vehicle-costs.test.ts`

**Interfaces:**
- Consumes: `VehicleExpenseCategory` from `./types`.
- Produces: `VEHICLE_EXPENSE_CATEGORIES: {value: VehicleExpenseCategory; label: string}[]`, `calculateTotalCostCents(acquisitionCostCents: number | null | undefined, expenses: {amount_cents: number}[]): number`, `calculateEstimatedMarginCents(priceCents: number, totalCostCents: number): number`, `calculateRealizedMarginCents(salePriceCents: number | null | undefined, totalCostCents: number): number | null`.

- [ ] **Step 1: Write the failing test**

```ts
// site/tests/lib/vehicle-costs.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTotalCostCents, calculateEstimatedMarginCents, calculateRealizedMarginCents } from '@/lib/vehicle-costs'

describe('calculateTotalCostCents', () => {
  it('sums acquisition cost and all expenses', () => {
    expect(calculateTotalCostCents(1000000, [{ amount_cents: 50000 }, { amount_cents: 20000 }])).toBe(1070000)
  })

  it('treats a missing acquisition cost as zero', () => {
    expect(calculateTotalCostCents(null, [{ amount_cents: 30000 }])).toBe(30000)
  })

  it('returns zero when there is no acquisition cost and no expenses', () => {
    expect(calculateTotalCostCents(null, [])).toBe(0)
  })
})

describe('calculateEstimatedMarginCents', () => {
  it('subtracts total cost from the listed price', () => {
    expect(calculateEstimatedMarginCents(6490000, 6000000)).toBe(490000)
  })

  it('returns a negative number when the vehicle is priced under cost', () => {
    expect(calculateEstimatedMarginCents(5000000, 6000000)).toBe(-1000000)
  })
})

describe('calculateRealizedMarginCents', () => {
  it('subtracts total cost from the actual sale price', () => {
    expect(calculateRealizedMarginCents(6200000, 6000000)).toBe(200000)
  })

  it('returns null when there is no sale price yet', () => {
    expect(calculateRealizedMarginCents(null, 6000000)).toBeNull()
    expect(calculateRealizedMarginCents(undefined, 6000000)).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/vehicle-costs.test.ts`
Expected: FAIL — `Cannot find module '@/lib/vehicle-costs'`.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/lib/vehicle-costs.ts
import type { VehicleExpenseCategory } from './types'

export const VEHICLE_EXPENSE_CATEGORIES: { value: VehicleExpenseCategory; label: string }[] = [
  { value: 'pintura', label: 'Pintura' },
  { value: 'lavagem_higienizacao', label: 'Lavagem/Higienização' },
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'documentacao', label: 'Documentação' },
  { value: 'funilaria', label: 'Funilaria' },
  { value: 'outros', label: 'Outros' },
]

export function calculateTotalCostCents(
  acquisitionCostCents: number | null | undefined,
  expenses: { amount_cents: number }[],
): number {
  const acquisition = acquisitionCostCents ?? 0
  const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount_cents, 0)
  return acquisition + expensesTotal
}

export function calculateEstimatedMarginCents(priceCents: number, totalCostCents: number): number {
  return priceCents - totalCostCents
}

export function calculateRealizedMarginCents(
  salePriceCents: number | null | undefined,
  totalCostCents: number,
): number | null {
  if (salePriceCents == null) return null
  return salePriceCents - totalCostCents
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd site && npx vitest run tests/lib/vehicle-costs.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/vehicle-costs.ts tests/lib/vehicle-costs.test.ts
git commit -m "feat(estoque): add vehicle expense categories and margin calculation"
```

---

### Task 4: Optionals catalog (`src/lib/vehicle-optionals.ts`)

**Files:**
- Create: `site/src/lib/vehicle-optionals.ts`
- Test: `site/tests/lib/vehicle-optionals.test.ts`

**Interfaces:**
- Produces: `VEHICLE_OPTIONALS: readonly string[]` (35-item fixed catalog), type `VehicleOptional`, `isValidOptional(value: string): value is VehicleOptional`.

- [ ] **Step 1: Write the failing test**

```ts
// site/tests/lib/vehicle-optionals.test.ts
import { describe, it, expect } from 'vitest'
import { VEHICLE_OPTIONALS, isValidOptional } from '@/lib/vehicle-optionals'

describe('VEHICLE_OPTIONALS', () => {
  it('has no duplicate entries', () => {
    expect(new Set(VEHICLE_OPTIONALS).size).toBe(VEHICLE_OPTIONALS.length)
  })

  it('includes the core items shown in the approved reference', () => {
    expect(VEHICLE_OPTIONALS).toContain('Ar condicionado')
    expect(VEHICLE_OPTIONALS).toContain('Central multimídia')
    expect(VEHICLE_OPTIONALS).toContain('Teto solar')
    expect(VEHICLE_OPTIONALS).toContain('Blindagem')
  })
})

describe('isValidOptional', () => {
  it('accepts a value from the catalog', () => {
    expect(isValidOptional('Ar condicionado')).toBe(true)
  })

  it('rejects a value not in the catalog', () => {
    expect(isValidOptional('Turbina de fibra')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/vehicle-optionals.test.ts`
Expected: FAIL — `Cannot find module '@/lib/vehicle-optionals'`.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/lib/vehicle-optionals.ts

/**
 * Fixed catalog of vehicle equipment/optionals — content only, no migration
 * needed to add or rename an item. Rendered as pills in VehicleOptionalsPicker.
 */
export const VEHICLE_OPTIONALS = [
  'Ar condicionado', 'Ar digital', 'Direção elétrica', 'Direção hidráulica',
  'Vidros elétricos', 'Travas elétricas', 'Retrovisores elétricos', 'Câmera de ré',
  'Sensor de estacionamento', 'Sensor de chuva', 'Central multimídia', 'Bluetooth',
  'GPS/Navegador', 'Banco de couro', 'Bancos aquecidos', 'Teto solar', 'Teto panorâmico',
  'Rodas de liga leve', 'Airbag duplo', 'Airbag lateral', 'ABS', 'Controle de tração',
  'Controle de estabilidade', 'Piloto automático', 'Freio a disco nas 4 rodas',
  'Volante multifuncional', 'Keyless Entry/Start', 'Computador de bordo',
  'Start/Stop automático', 'Carregador wireless', 'Apple CarPlay/Android Auto',
  'Kit multimídia original', '4x4/AWD/Tração integral', 'Blindagem', 'GNV instalado',
] as const

export type VehicleOptional = (typeof VEHICLE_OPTIONALS)[number]

export function isValidOptional(value: string): value is VehicleOptional {
  return (VEHICLE_OPTIONALS as readonly string[]).includes(value)
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd site && npx vitest run tests/lib/vehicle-optionals.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/vehicle-optionals.ts tests/lib/vehicle-optionals.test.ts
git commit -m "feat(estoque): add fixed vehicle optionals catalog"
```

---

### Task 5: Stock-turnover logic (`src/lib/vehicle-stock.ts`)

**Files:**
- Create: `site/src/lib/vehicle-stock.ts`
- Test: `site/tests/lib/vehicle-stock.test.ts`

**Interfaces:**
- Consumes: `Vehicle` from `./types`.
- Produces: `daysInStock(vehicle, now?: Date): number`, `hasMarginDefined(vehicle): boolean`, `type StockFilter = 'all' | 'no_margin' | 'turnover' | 'preparing'`, `interface StockFilterCounts { all, no_margin, turnover, preparing: number }`, `countStockFilters(vehicles, thresholdDays, now?): StockFilterCounts`, `applyStockFilter(vehicles, filter, thresholdDays, now?)`, `matchesStockSearch(vehicle, query): boolean`, `parseTurnoverThreshold(raw: string | null): number`.

- [ ] **Step 1: Write the failing tests**

```ts
// site/tests/lib/vehicle-stock.test.ts
import { describe, it, expect } from 'vitest'
import {
  daysInStock, hasMarginDefined, countStockFilters, applyStockFilter, matchesStockSearch, parseTurnoverThreshold,
} from '@/lib/vehicle-stock'

const NOW = new Date('2026-09-01T12:00:00.000Z')

function makeVehicle(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'v-1', status: 'available', brand: 'Fiat', model: 'Argo', version: 'Drive', color: 'Branco',
    acquisition_cost_cents: null, min_sale_price_cents: null,
    acquired_at: null, created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('daysInStock', () => {
  it('counts from acquired_at when present', () => {
    expect(daysInStock(makeVehicle({ acquired_at: '2026-08-01' }), NOW)).toBe(31)
  })

  it('falls back to created_at when acquired_at is missing', () => {
    expect(daysInStock(makeVehicle({ acquired_at: null, created_at: '2026-08-20T00:00:00.000Z' }), NOW)).toBe(12)
  })

  it('never returns a negative number for a future date', () => {
    expect(daysInStock(makeVehicle({ acquired_at: '2026-09-05' }), NOW)).toBe(0)
  })
})

describe('hasMarginDefined', () => {
  it('is false when acquisition cost or minimum price is missing', () => {
    expect(hasMarginDefined(makeVehicle({ acquisition_cost_cents: 100, min_sale_price_cents: null }))).toBe(false)
    expect(hasMarginDefined(makeVehicle({ acquisition_cost_cents: null, min_sale_price_cents: 100 }))).toBe(false)
  })

  it('is true when both are set', () => {
    expect(hasMarginDefined(makeVehicle({ acquisition_cost_cents: 100, min_sale_price_cents: 200 }))).toBe(true)
  })
})

describe('countStockFilters / applyStockFilter', () => {
  const vehicles = [
    makeVehicle({ id: 'a', status: 'available', acquisition_cost_cents: 100, min_sale_price_cents: 200, acquired_at: '2026-08-01' }),
    makeVehicle({ id: 'b', status: 'available', acquisition_cost_cents: null, min_sale_price_cents: null, acquired_at: '2026-05-01' }),
    makeVehicle({ id: 'c', status: 'preparing', acquisition_cost_cents: null, min_sale_price_cents: null }),
    makeVehicle({ id: 'd', status: 'sold', acquisition_cost_cents: 100, min_sale_price_cents: 200 }),
  ]

  it('counts every filter bucket', () => {
    expect(countStockFilters(vehicles, 90, NOW)).toEqual({ all: 4, no_margin: 2, turnover: 1, preparing: 1 })
  })

  it('"no_margin" includes any non-sold vehicle without a margin, but excludes sold ones', () => {
    const sold = makeVehicle({ id: 'e', status: 'sold', acquisition_cost_cents: null, min_sale_price_cents: null })
    expect(applyStockFilter([...vehicles, sold], 'no_margin', 90, NOW).map((v) => v.id)).toEqual(['b', 'c'])
  })

  it('"turnover" only considers available vehicles past the threshold', () => {
    expect(applyStockFilter(vehicles, 'turnover', 90, NOW).map((v) => v.id)).toEqual(['b'])
  })

  it('"preparing" returns only vehicles in that status', () => {
    expect(applyStockFilter(vehicles, 'preparing', 90, NOW).map((v) => v.id)).toEqual(['c'])
  })

  it('"all" returns every vehicle unfiltered', () => {
    expect(applyStockFilter(vehicles, 'all', 90, NOW).map((v) => v.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('matchesStockSearch', () => {
  const vehicle = makeVehicle({ brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', color: 'Branco' })

  it('matches brand, model, version, or color case-insensitively', () => {
    expect(matchesStockSearch(vehicle, 'fiat')).toBe(true)
    expect(matchesStockSearch(vehicle, 'ARGO')).toBe(true)
    expect(matchesStockSearch(vehicle, 'branco')).toBe(true)
  })

  it('returns true for an empty or blank query', () => {
    expect(matchesStockSearch(vehicle, '')).toBe(true)
    expect(matchesStockSearch(vehicle, '   ')).toBe(true)
  })

  it('returns false when nothing matches', () => {
    expect(matchesStockSearch(vehicle, 'volkswagen')).toBe(false)
  })
})

describe('parseTurnoverThreshold', () => {
  it('parses a valid numeric string', () => {
    expect(parseTurnoverThreshold('120')).toBe(120)
  })

  it('falls back to 90 for null, empty, zero, or non-numeric input', () => {
    expect(parseTurnoverThreshold(null)).toBe(90)
    expect(parseTurnoverThreshold('')).toBe(90)
    expect(parseTurnoverThreshold('0')).toBe(90)
    expect(parseTurnoverThreshold('abc')).toBe(90)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/vehicle-stock.test.ts`
Expected: FAIL — `Cannot find module '@/lib/vehicle-stock'`.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/lib/vehicle-stock.ts
import type { Vehicle } from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const DEFAULT_TURNOVER_THRESHOLD_DAYS = 90

type StockVehicle = Pick<Vehicle, 'status' | 'acquisition_cost_cents' | 'min_sale_price_cents' | 'acquired_at' | 'created_at'>
type SearchableVehicle = Pick<Vehicle, 'brand' | 'model' | 'version' | 'color'>

export function daysInStock(vehicle: Pick<Vehicle, 'acquired_at' | 'created_at'>, now: Date = new Date()): number {
  const referenceDate = new Date(vehicle.acquired_at ?? vehicle.created_at)
  const diffMs = now.getTime() - referenceDate.getTime()
  return Math.max(0, Math.floor(diffMs / MS_PER_DAY))
}

export function hasMarginDefined(vehicle: Pick<Vehicle, 'acquisition_cost_cents' | 'min_sale_price_cents'>): boolean {
  return vehicle.acquisition_cost_cents != null && vehicle.min_sale_price_cents != null
}

export type StockFilter = 'all' | 'no_margin' | 'turnover' | 'preparing'

export interface StockFilterCounts {
  all: number
  no_margin: number
  turnover: number
  preparing: number
}

function isNoMargin(vehicle: StockVehicle): boolean {
  return vehicle.status !== 'sold' && !hasMarginDefined(vehicle)
}

function isTurnoverStale(vehicle: StockVehicle, thresholdDays: number, now: Date): boolean {
  return vehicle.status === 'available' && daysInStock(vehicle, now) >= thresholdDays
}

export function countStockFilters(
  vehicles: StockVehicle[],
  thresholdDays: number,
  now: Date = new Date(),
): StockFilterCounts {
  return {
    all: vehicles.length,
    no_margin: vehicles.filter((v) => isNoMargin(v)).length,
    turnover: vehicles.filter((v) => isTurnoverStale(v, thresholdDays, now)).length,
    preparing: vehicles.filter((v) => v.status === 'preparing').length,
  }
}

export function applyStockFilter<T extends StockVehicle>(
  vehicles: T[],
  filter: StockFilter,
  thresholdDays: number,
  now: Date = new Date(),
): T[] {
  switch (filter) {
    case 'no_margin':
      return vehicles.filter((v) => isNoMargin(v))
    case 'turnover':
      return vehicles.filter((v) => isTurnoverStale(v, thresholdDays, now))
    case 'preparing':
      return vehicles.filter((v) => v.status === 'preparing')
    default:
      return vehicles
  }
}

export function matchesStockSearch(vehicle: SearchableVehicle, query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true
  const haystack = [vehicle.brand, vehicle.model, vehicle.version, vehicle.color]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(trimmed)
}

/** Parses the `stock_turnover_threshold_days` site_settings value, falling back to 90. */
export function parseTurnoverThreshold(raw: string | null): number {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TURNOVER_THRESHOLD_DAYS
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/vehicle-stock.test.ts`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/vehicle-stock.ts tests/lib/vehicle-stock.test.ts
git commit -m "feat(estoque): add stock-turnover, margin-filter, and search logic"
```

---

### Task 6: `withCurrentValue` safety net (`src/lib/normalize.ts`)

**Files:**
- Modify: `site/src/lib/normalize.ts`
- Test: `site/tests/lib/normalize.test.ts`

**Interfaces:**
- Produces: `withCurrentValue(options: string[], current: string | null | undefined): string[]`.

- [ ] **Step 1: Write the failing test**

Append to `site/tests/lib/normalize.test.ts`:

```ts
import { normalizeTransmission, normalizeFuelType, normalizeColor, withCurrentValue } from '@/lib/normalize'
// (replace the existing import line at the top of the file with the one above)

describe('withCurrentValue', () => {
  it('returns the options unchanged when the current value is already in the list', () => {
    expect(withCurrentValue(['Manual', 'Automático'], 'Manual')).toEqual(['Manual', 'Automático'])
  })

  it('prepends the current value when it is not in the list, so an old row never loses its value', () => {
    expect(withCurrentValue(['Manual', 'Automático'], 'Semi-automático')).toEqual(['Semi-automático', 'Manual', 'Automático'])
  })

  it('returns the options unchanged when there is no current value', () => {
    expect(withCurrentValue(['Manual', 'Automático'], null)).toEqual(['Manual', 'Automático'])
    expect(withCurrentValue(['Manual', 'Automático'], undefined)).toEqual(['Manual', 'Automático'])
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/normalize.test.ts`
Expected: FAIL — `withCurrentValue is not a function` (or not exported).

- [ ] **Step 3: Write the implementation**

Append to `site/src/lib/normalize.ts`:

```ts
/**
 * Select-options list for a normalized field, guaranteed to include the
 * record's current stored value even if it predates the canonical list
 * (so editing an old/legacy row never silently blanks or loses its value).
 */
export function withCurrentValue(options: string[], current: string | null | undefined): string[] {
  if (!current || options.includes(current)) return options
  return [current, ...options]
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd site && npx vitest run tests/lib/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/normalize.ts tests/lib/normalize.test.ts
git commit -m "feat(estoque): add withCurrentValue helper for select-option safety"
```

---

### Task 7: Validation schemas (`src/lib/validation.ts`)

**Files:**
- Modify: `site/src/lib/validation.ts`
- Test: `site/tests/lib/validation.test.ts`

**Interfaces:**
- Consumes: `VehicleExpenseCategory` from `./types`; `VEHICLE_OPTIONALS` from `./vehicle-optionals`.
- Produces: `vehicleExpenseSchema`, `VehicleExpenseFormValues`; extended `vehicleFormSchema`/`VehicleFormValues` (adds `acquisitionCostCents?`, `minSalePriceCents?`, `expenses?: VehicleExpenseFormValues[]`, `acquiredAt?`, `fipeBrandCode?`, `fipeModelCode?`, `fipeYearCode?`, `fipeValueCents?`, `fipeFetchedAt?`, `optionals?: string[]`); `markVehicleSoldSchema`, `MarkVehicleSoldValues`.

- [ ] **Step 1: Write the failing tests**

Append to `site/tests/lib/validation.test.ts`:

```ts
import { vehicleExpenseSchema, markVehicleSoldSchema, vehicleFormSchema } from '@/lib/validation'
// (add these named imports to whatever import line already exists)

describe('vehicleExpenseSchema', () => {
  it('accepts a fixed category without a description', () => {
    const result = vehicleExpenseSchema.parse({ category: 'pintura', amountCents: 50000 })
    expect(result).toMatchObject({ category: 'pintura', amountCents: 50000 })
  })

  it('requires a description when category is "outros"', () => {
    expect(() => vehicleExpenseSchema.parse({ category: 'outros', amountCents: 20000 })).toThrow()
    expect(() => vehicleExpenseSchema.parse({ category: 'outros', description: '  ', amountCents: 20000 })).toThrow()
  })

  it('accepts "outros" with a non-empty description', () => {
    const result = vehicleExpenseSchema.parse({ category: 'outros', description: 'Alarme', amountCents: 20000 })
    expect(result.description).toBe('Alarme')
  })

  it('rejects an unknown category', () => {
    expect(() => vehicleExpenseSchema.parse({ category: 'turbina', amountCents: 20000 })).toThrow()
  })
})

describe('markVehicleSoldSchema', () => {
  it('accepts a valid sale without a buyer', () => {
    const result = markVehicleSoldSchema.parse({ salePriceCents: 6200000, soldAt: '2026-08-31' })
    expect(result).toMatchObject({ salePriceCents: 6200000, soldAt: '2026-08-31' })
  })

  it('accepts a valid sale with a buyer lead id', () => {
    const result = markVehicleSoldSchema.parse({ salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: '11111111-1111-1111-1111-111111111111' })
    expect(result.buyerLeadId).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('rejects a negative sale price', () => {
    expect(() => markVehicleSoldSchema.parse({ salePriceCents: -1, soldAt: '2026-08-31' })).toThrow()
  })

  it('rejects a missing sale date', () => {
    expect(() => markVehicleSoldSchema.parse({ salePriceCents: 100 })).toThrow()
  })
})

describe('vehicleFormSchema — costs, FIPE, acquisition date, optionals', () => {
  it('accepts a full payload with costs, expenses, FIPE fields, acquired date, and optionals', () => {
    const result = vehicleFormSchema.parse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000,
      acquisitionCostCents: 4000000, minSalePriceCents: 4200000,
      expenses: [{ category: 'pintura', amountCents: 50000 }],
      acquiredAt: '2026-08-01',
      fipeBrandCode: '21', fipeModelCode: '437', fipeYearCode: '1987-1',
      fipeValueCents: 614700, fipeFetchedAt: '2026-08-01T12:00:00.000Z',
      optionals: ['Ar condicionado', 'Teto solar'],
    })
    expect(result.acquisitionCostCents).toBe(4000000)
    expect(result.expenses).toHaveLength(1)
    expect(result.optionals).toEqual(['Ar condicionado', 'Teto solar'])
  })

  it('defaults expenses and optionals to an empty array when omitted', () => {
    const result = vehicleFormSchema.parse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000,
    })
    expect(result.expenses).toEqual([])
    expect(result.optionals).toEqual([])
  })

  it('rejects an optional value outside the fixed catalog', () => {
    expect(() => vehicleFormSchema.parse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, optionals: ['Turbina de fibra'],
    })).toThrow()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/validation.test.ts`
Expected: FAIL — `vehicleExpenseSchema`/`markVehicleSoldSchema` not exported, and the new `vehicleFormSchema` fields are stripped/rejected.

- [ ] **Step 3: Write the implementation**

In `site/src/lib/validation.ts`, add the import and the new schema above `vehicleFormSchema`:

```ts
import { VEHICLE_OPTIONALS } from './vehicle-optionals'

export const vehicleExpenseSchema = z
  .object({
    category: z.enum(['pintura', 'lavagem_higienizacao', 'mecanica', 'documentacao', 'funilaria', 'outros']),
    description: z.string().optional(),
    amountCents: z.coerce.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.category === 'outros' && !value.description?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['description'], message: 'Descrição é obrigatória para categoria "Outros"' })
    }
  })
export type VehicleExpenseFormValues = z.infer<typeof vehicleExpenseSchema>
```

Then extend `vehicleFormSchema` (add these fields inside the existing `z.object({...})`, alongside `horsepower`):

```ts
  acquisitionCostCents: z.coerce.number().int().min(0).optional(),
  minSalePriceCents: z.coerce.number().int().min(0).optional(),
  expenses: z.array(vehicleExpenseSchema).optional().default([]),
  acquiredAt: z.string().optional(),
  fipeBrandCode: z.string().optional(),
  fipeModelCode: z.string().optional(),
  fipeYearCode: z.string().optional(),
  fipeValueCents: z.coerce.number().int().min(0).optional(),
  fipeFetchedAt: z.string().optional(),
  optionals: z.array(z.enum(VEHICLE_OPTIONALS)).optional().default([]),
```

Then, after `vehicleFormSchema`/`VehicleFormValues`, add:

```ts
export const markVehicleSoldSchema = z.object({
  salePriceCents: z.coerce.number().int().min(0, 'Preço de venda não pode ser negativo'),
  soldAt: z.string().min(1, 'Informe a data da venda'),
  buyerLeadId: z.string().uuid().optional(),
})
export type MarkVehicleSoldValues = z.infer<typeof markVehicleSoldSchema>
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `cd site && npm test`
Expected: PASS (the pre-existing `vehicleFormSchema` tests must still pass unchanged, since all new fields are optional/defaulted).

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation.ts tests/lib/validation.test.ts
git commit -m "feat(estoque): add expense, mark-sold, and extended vehicle validation schemas"
```

---

### Task 8: `lib/actions/vehicles.ts` — costs, expenses, optionals, mark-sold, 3-way status

**Files:**
- Modify: `site/src/lib/actions/vehicles.ts`
- Test: `site/tests/lib/actions/vehicles.test.ts`

**Interfaces:**
- Consumes: `markVehicleSoldSchema` from `../validation`; `VehicleStatus` from `../types`.
- Produces: extended `saveVehicle` payload/behavior; `MarkVehicleSoldInput`, `markVehicleSold(client, id, input): Promise<void>`; modified `setVehicleStatus(client, id, status): Promise<void>` (clears sale fields whenever the new status is not `'sold'`).

- [ ] **Step 1: Write the failing tests**

Append to `site/tests/lib/actions/vehicles.test.ts` (reuse the existing `makeClient` helper already in that file):

```ts
it('includes acquisition cost, minimum sale price, acquired date, FIPE fields, and optionals when provided', async () => {
  const { from, chain } = makeClient()
  await saveVehicle({ from } as any, {
    brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
    mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    acquisitionCostCents: 4000000, minSalePriceCents: 4200000, acquiredAt: '2026-08-01',
    fipeBrandCode: '21', fipeModelCode: '437', fipeYearCode: '1987-1',
    fipeValueCents: 614700, fipeFetchedAt: '2026-08-01T12:00:00.000Z',
    optionals: ['Ar condicionado', 'Teto solar'],
  })
  expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
    acquisition_cost_cents: 4000000, min_sale_price_cents: 4200000, acquired_at: '2026-08-01',
    fipe_brand_code: '21', fipe_model_code: '437', fipe_year_code: '1987-1',
    fipe_value_cents: 614700, fipe_fetched_at: '2026-08-01T12:00:00.000Z',
    optionals: ['Ar condicionado', 'Teto solar'],
  }))
})

it('writes null/empty for acquisition cost, minimum sale price, acquired date, FIPE fields, and optionals when not provided', async () => {
  const { from, chain } = makeClient()
  await saveVehicle({ from } as any, {
    brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
    mileageKm: 32000, priceCents: 6490000, imagePaths: [],
  })
  expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
    acquisition_cost_cents: null, min_sale_price_cents: null, acquired_at: null,
    fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null, fipe_value_cents: null, fipe_fetched_at: null,
    optionals: [],
  }))
})

it('replaces vehicle_expenses with the current list on save', async () => {
  const { from, chain } = makeClient()
  await saveVehicle({ from } as any, {
    id: 'existing-id', brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
    mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    expenses: [
      { category: 'pintura', amountCents: 50000 },
      { category: 'outros', description: 'Alarme', amountCents: 20000 },
    ],
  })
  expect(from).toHaveBeenCalledWith('vehicle_expenses')
  expect(chain.delete).toHaveBeenCalled()
  expect(chain.insert).toHaveBeenCalledWith([
    { vehicle_id: 'existing-id', category: 'pintura', description: null, amount_cents: 50000 },
    { vehicle_id: 'existing-id', category: 'outros', description: 'Alarme', amount_cents: 20000 },
  ])
})

it('rejects an expense with category "outros" and no description', async () => {
  const { from, chain } = makeClient()
  await expect(saveVehicle({ from } as any, {
    brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
    mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    expenses: [{ category: 'outros', amountCents: 20000 }],
  } as any)).rejects.toThrow()
  expect(chain.insert).not.toHaveBeenCalled()
})

describe('markVehicleSold', () => {
  it('sets status to sold and records sale price, date, and buyer', async () => {
    const { from, chain } = makeClient()
    // buyerLeadId must be a real UUID — markVehicleSoldSchema (Task 7) validates with .uuid().
    await markVehicleSold({ from } as any, 'v-1', { salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: '11111111-1111-1111-1111-111111111111' })
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(chain.update).toHaveBeenCalledWith({
      status: 'sold', sale_price_cents: 6200000, sold_at: '2026-08-31', buyer_lead_id: '11111111-1111-1111-1111-111111111111',
    })
    expect(chain.eq).toHaveBeenCalledWith('id', 'v-1')
  })

  it('records the sale without a buyer when none was selected', async () => {
    const { from, chain } = makeClient()
    await markVehicleSold({ from } as any, 'v-1', { salePriceCents: 6200000, soldAt: '2026-08-31' })
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ buyer_lead_id: null }))
  })

  it('rejects a negative sale price', async () => {
    const { from } = makeClient()
    await expect(markVehicleSold({ from } as any, 'v-1', { salePriceCents: -100, soldAt: '2026-08-31' } as any)).rejects.toThrow()
  })
})
```

Then, inside the existing `describe('setVehicleFeatured / setVehicleStatus', ...)` block, add:

```ts
it('clears sale price, date, and buyer when reverting to available', async () => {
  const { from, chain } = makeClient()
  await setVehicleStatus({ from } as any, 'v-1', 'available')
  expect(chain.update).toHaveBeenCalledWith({
    status: 'available', sale_price_cents: null, sold_at: null, buyer_lead_id: null,
  })
})

it('clears sale price, date, and buyer when moving to preparing', async () => {
  const { from, chain } = makeClient()
  await setVehicleStatus({ from } as any, 'v-1', 'preparing')
  expect(chain.update).toHaveBeenCalledWith({
    status: 'preparing', sale_price_cents: null, sold_at: null, buyer_lead_id: null,
  })
})

it('does not touch sale fields when setting status to sold directly', async () => {
  const { from, chain } = makeClient()
  await setVehicleStatus({ from } as any, 'v-1', 'sold')
  expect(chain.update).toHaveBeenCalledWith({ status: 'sold' })
})
```

And update the top import line to include the new function:

```ts
import { saveVehicle, deleteVehicle, setVehicleFeatured, setVehicleStatus, markVehicleSold } from '@/lib/actions/vehicles'
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/actions/vehicles.test.ts`
Expected: FAIL — `markVehicleSold` not exported, new payload fields missing, expenses not persisted, status-clearing not implemented.

- [ ] **Step 3: Write the implementation**

In `site/src/lib/actions/vehicles.ts`, update the import line:

```ts
import { vehicleFormSchema, markVehicleSoldSchema, type VehicleFormValues } from '../validation'
```

Extend the `payload` object inside `saveVehicle` (add alongside the existing `horsepower`/`plate` fields):

```ts
    acquisition_cost_cents: values.acquisitionCostCents ?? null,
    min_sale_price_cents: values.minSalePriceCents ?? null,
    acquired_at: values.acquiredAt ?? null,
    fipe_brand_code: values.fipeBrandCode ?? null,
    fipe_model_code: values.fipeModelCode ?? null,
    fipe_year_code: values.fipeYearCode ?? null,
    fipe_value_cents: values.fipeValueCents ?? null,
    fipe_fetched_at: values.fipeFetchedAt ?? null,
    optionals: values.optionals,
```

After the existing `vehicle_images` delete+insert block (still inside `saveVehicle`, before `return { id: vehicleId! }`), add:

```ts
  await client.from('vehicle_expenses').delete().eq('vehicle_id', vehicleId)
  if (values.expenses.length > 0) {
    const expenseRows = values.expenses.map((expense) => ({
      vehicle_id: vehicleId,
      category: expense.category,
      description: expense.description ?? null,
      amount_cents: expense.amountCents,
    }))
    const { error: expensesError } = await client.from('vehicle_expenses').insert(expenseRows)
    if (expensesError) throw expensesError
  }
```

Add after `deleteVehicle`:

```ts
export interface MarkVehicleSoldInput {
  salePriceCents: number
  soldAt: string
  buyerLeadId?: string
}

export async function markVehicleSold(client: SupabaseClient, id: string, input: MarkVehicleSoldInput): Promise<void> {
  const values = markVehicleSoldSchema.parse(input)
  const { error } = await client
    .from('vehicles')
    .update({
      status: 'sold',
      sale_price_cents: values.salePriceCents,
      sold_at: values.soldAt,
      buyer_lead_id: values.buyerLeadId ?? null,
    })
    .eq('id', id)
  if (error) throw error
}
```

Replace `setVehicleStatus`:

```ts
export async function setVehicleStatus(client: SupabaseClient, id: string, status: VehicleStatus): Promise<void> {
  const payload: Record<string, unknown> = { status }
  if (status !== 'sold') {
    payload.sale_price_cents = null
    payload.sold_at = null
    payload.buyer_lead_id = null
  }
  const { error } = await client.from('vehicles').update(payload).eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/actions/vehicles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/vehicles.ts tests/lib/actions/vehicles.test.ts
git commit -m "feat(estoque): persist costs/expenses/FIPE/optionals and add markVehicleSold"
```

---

### Task 9: Vehicle expenses queries (`src/lib/queries/vehicle-expenses.ts`)

**Files:**
- Create: `site/src/lib/queries/vehicle-expenses.ts`
- Test: `site/tests/lib/queries/vehicle-expenses.test.ts`

**Interfaces:**
- Consumes: `VehicleExpense` from `../types`.
- Produces: `getVehicleExpenses(client, vehicleId: string): Promise<VehicleExpense[]>`, `getVehicleExpenseTotals(client, vehicleIds: string[]): Promise<Record<string, number>>` (batched, same pattern as `getImageCountsByVehicleIds` in `vehicle-images.ts`).

- [ ] **Step 1: Write the failing tests**

```ts
// site/tests/lib/queries/vehicle-expenses.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getVehicleExpenses, getVehicleExpenseTotals } from '@/lib/queries/vehicle-expenses'

describe('getVehicleExpenses', () => {
  it('queries vehicle_expenses filtered by vehicle_id, ordered by created_at', async () => {
    const row = { id: 'e-1', vehicle_id: 'v-1', category: 'pintura', description: null, amount_cents: 50000, created_at: '2026-08-01' }
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(async () => ({ data: [row], error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getVehicleExpenses(client as any, 'v-1')
    expect(client.from).toHaveBeenCalledWith('vehicle_expenses')
    expect(chain.eq).toHaveBeenCalledWith('vehicle_id', 'v-1')
    expect(result).toEqual([row])
  })
})

describe('getVehicleExpenseTotals', () => {
  it('sums amount_cents per vehicle across one batched query', async () => {
    const rows = [
      { vehicle_id: 'v-1', amount_cents: 50000 },
      { vehicle_id: 'v-1', amount_cents: 20000 },
      { vehicle_id: 'v-2', amount_cents: 10000 },
    ]
    const chain: any = { select: vi.fn(() => chain), in: vi.fn(async () => ({ data: rows, error: null })) }
    const client = { from: vi.fn(() => chain) }
    const result = await getVehicleExpenseTotals(client as any, ['v-1', 'v-2'])
    expect(chain.in).toHaveBeenCalledWith('vehicle_id', ['v-1', 'v-2'])
    expect(result).toEqual({ 'v-1': 70000, 'v-2': 10000 })
  })

  it('returns an empty object without querying when given no ids', async () => {
    const client = { from: vi.fn() }
    const result = await getVehicleExpenseTotals(client as any, [])
    expect(result).toEqual({})
    expect(client.from).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/queries/vehicle-expenses.test.ts`
Expected: FAIL — `Cannot find module '@/lib/queries/vehicle-expenses'`.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/lib/queries/vehicle-expenses.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleExpense } from '../types'

export async function getVehicleExpenses(client: SupabaseClient, vehicleId: string): Promise<VehicleExpense[]> {
  const { data, error } = await client
    .from('vehicle_expenses')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as VehicleExpense[]
}

/** Batched sum of expenses per vehicle, for the "Custo"/"Lucro" figures on the stock grid. */
export async function getVehicleExpenseTotals(
  client: SupabaseClient,
  vehicleIds: string[],
): Promise<Record<string, number>> {
  if (vehicleIds.length === 0) return {}

  const { data, error } = await client.from('vehicle_expenses').select('vehicle_id, amount_cents').in('vehicle_id', vehicleIds)
  if (error) throw error

  const totals: Record<string, number> = {}
  for (const row of (data ?? []) as Pick<VehicleExpense, 'vehicle_id' | 'amount_cents'>[]) {
    totals[row.vehicle_id] = (totals[row.vehicle_id] ?? 0) + row.amount_cents
  }
  return totals
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/queries/vehicle-expenses.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/vehicle-expenses.ts tests/lib/queries/vehicle-expenses.test.ts
git commit -m "feat(estoque): add getVehicleExpenses and batched getVehicleExpenseTotals"
```

---

### Task 10: `adminMarkVehicleSold` server action wrapper

**Files:**
- Modify: `site/src/app/actions/vehicles.ts`
- Modify: `site/tests/app/actions/admin-auth.test.ts`

**Interfaces:**
- Consumes: `markVehicleSold`, `MarkVehicleSoldInput` from `@/lib/actions/vehicles`.
- Produces: `adminMarkVehicleSold(id: string, input: MarkVehicleSoldInput): Promise<void>`.

- [ ] **Step 1: Write the failing test**

In `site/tests/app/actions/admin-auth.test.ts`, add `adminMarkVehicleSold` to the existing import line:

```ts
import { adminDeleteVehicle, adminMarkVehicleSold } from '@/app/actions/vehicles'
```

Append inside the `describe('admin server actions — explicit auth check', ...)` block:

```ts
it('adminMarkVehicleSold rejects an unauthenticated call before touching the database', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null })
  await expect(adminMarkVehicleSold('v-1', { salePriceCents: 100, soldAt: '2026-08-31' })).rejects.toThrow('Não autenticado.')
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/app/actions/admin-auth.test.ts`
Expected: FAIL — `adminMarkVehicleSold` is not exported.

- [ ] **Step 3: Write the implementation**

In `site/src/app/actions/vehicles.ts`, update the type import and add the new wrapper:

```ts
import type { MarkVehicleSoldInput } from '@/lib/actions/vehicles'
```

```ts
export async function adminMarkVehicleSold(id: string, input: MarkVehicleSoldInput) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await vehicleActions.markVehicleSold(client, id, input)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd site && npx vitest run tests/app/actions/admin-auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/vehicles.ts tests/app/actions/admin-auth.test.ts
git commit -m "feat(estoque): add adminMarkVehicleSold server action"
```

---

### Task 11: FIPE client (`src/lib/fipe.ts`)

**Files:**
- Create: `site/src/lib/fipe.ts`
- Test: `site/tests/lib/fipe.test.ts`

**Interfaces:**
- Produces: `FipeBrand{code,name}`, `FipeModel{code,name}`, `FipeYear{code,name}`, `FipeValue{valueCents,fipeCode,referenceMonth}`, `FipeError`, `parseFipeValueToCents(raw: string): number`, `fetchFipeBrands(): Promise<FipeBrand[]>`, `fetchFipeModels(brandCode: string): Promise<FipeModel[]>`, `fetchFipeYears(brandCode: string, modelCode: string): Promise<FipeYear[]>`, `fetchFipeValue(brandCode: string, modelCode: string, yearCode: string): Promise<FipeValue>`.

- [ ] **Step 1: Write the failing tests**

```ts
// site/tests/lib/fipe.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipeValue, parseFipeValueToCents, FipeError } from '@/lib/fipe'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('parseFipeValueToCents', () => {
  it('parses a Brazilian-formatted currency string to integer cents', () => {
    expect(parseFipeValueToCents('R$ 6.147,00')).toBe(614700)
    expect(parseFipeValueToCents('R$ 64.900,50')).toBe(6490050)
  })

  it('throws FipeError for an unparseable value', () => {
    expect(() => parseFipeValueToCents('indisponível')).toThrow(FipeError)
  })
})

describe('fetchFipeBrands', () => {
  it('maps the raw brand list to {code, name}', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify([{ codigo: '21', nome: 'Fiat' }]), { status: 200 })) as any
    const result = await fetchFipeBrands()
    expect(result).toEqual([{ code: '21', name: 'Fiat' }])
  })

  it('throws FipeError on a non-ok response', async () => {
    global.fetch = vi.fn(async () => new Response('erro', { status: 500 })) as any
    await expect(fetchFipeBrands()).rejects.toThrow(FipeError)
  })
})

describe('fetchFipeModels', () => {
  it('maps the raw modelos list to {code, name}', async () => {
    global.fetch = vi.fn(async (url: string) => {
      expect(url).toContain('/marcas/21/modelos')
      return new Response(JSON.stringify({ modelos: [{ codigo: 437, nome: '147 C/ CL' }] }), { status: 200 })
    }) as any
    const result = await fetchFipeModels('21')
    expect(result).toEqual([{ code: '437', name: '147 C/ CL' }])
  })
})

describe('fetchFipeYears', () => {
  it('maps the raw anos list to {code, name}', async () => {
    global.fetch = vi.fn(async (url: string) => {
      expect(url).toContain('/marcas/21/modelos/437/anos')
      return new Response(JSON.stringify([{ codigo: '1987-1', nome: '1987 Gasolina' }]), { status: 200 })
    }) as any
    const result = await fetchFipeYears('21', '437')
    expect(result).toEqual([{ code: '1987-1', name: '1987 Gasolina' }])
  })
})

describe('fetchFipeValue', () => {
  it('parses the value and includes the FIPE reference code and month', async () => {
    global.fetch = vi.fn(async (url: string) => {
      expect(url).toContain('/marcas/21/modelos/437/anos/1987-1')
      return new Response(JSON.stringify({
        Valor: 'R$ 6.147,00', CodigoFipe: '001124-0', MesReferencia: 'agosto de 2026',
      }), { status: 200 })
    }) as any
    const result = await fetchFipeValue('21', '437', '1987-1')
    expect(result).toEqual({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' })
  })

  it('throws FipeError on a non-ok response', async () => {
    global.fetch = vi.fn(async () => new Response('erro', { status: 500 })) as any
    await expect(fetchFipeValue('21', '437', '1987-1')).rejects.toThrow(FipeError)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/fipe.test.ts`
Expected: FAIL — `Cannot find module '@/lib/fipe'`.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/lib/fipe.ts
export interface FipeBrand { code: string; name: string }
export interface FipeModel { code: string; name: string }
export interface FipeYear { code: string; name: string }
export interface FipeValue { valueCents: number; fipeCode: string; referenceMonth: string }

export class FipeError extends Error {}

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros'

interface RawBrand { codigo: string; nome: string }
interface RawModelsResponse { modelos: { codigo: number; nome: string }[] }
interface RawYear { codigo: string; nome: string }
interface RawValue { Valor: string; CodigoFipe: string; MesReferencia: string }

export function parseFipeValueToCents(raw: string): number {
  const numeric = raw.replace(/[^\d,]/g, '').replace(',', '.')
  const reais = Number(numeric)
  if (Number.isNaN(reais) || numeric === '') throw new FipeError(`Valor FIPE inesperado: "${raw}"`)
  return Math.round(reais * 100)
}

export async function fetchFipeBrands(): Promise<FipeBrand[]> {
  const response = await fetch(`${BASE_URL}/marcas`)
  if (!response.ok) throw new FipeError(`FIPE (marcas) retornou status ${response.status}`)
  const data = (await response.json()) as RawBrand[]
  return data.map((b) => ({ code: b.codigo, name: b.nome }))
}

export async function fetchFipeModels(brandCode: string): Promise<FipeModel[]> {
  const response = await fetch(`${BASE_URL}/marcas/${encodeURIComponent(brandCode)}/modelos`)
  if (!response.ok) throw new FipeError(`FIPE (modelos) retornou status ${response.status}`)
  const data = (await response.json()) as RawModelsResponse
  return data.modelos.map((m) => ({ code: String(m.codigo), name: m.nome }))
}

export async function fetchFipeYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
  const response = await fetch(
    `${BASE_URL}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos`,
  )
  if (!response.ok) throw new FipeError(`FIPE (anos) retornou status ${response.status}`)
  const data = (await response.json()) as RawYear[]
  return data.map((y) => ({ code: y.codigo, name: y.nome }))
}

export async function fetchFipeValue(brandCode: string, modelCode: string, yearCode: string): Promise<FipeValue> {
  const response = await fetch(
    `${BASE_URL}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos/${encodeURIComponent(yearCode)}`,
  )
  if (!response.ok) throw new FipeError(`FIPE (valor) retornou status ${response.status}`)
  const data = (await response.json()) as RawValue
  return {
    valueCents: parseFipeValueToCents(data.Valor),
    fipeCode: data.CodigoFipe,
    referenceMonth: data.MesReferencia,
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/fipe.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fipe.ts tests/lib/fipe.test.ts
git commit -m "feat(estoque): add parallelum FIPE API client"
```

---

### Task 12: FIPE admin API routes

**Files:**
- Create: `site/src/app/api/admin/fipe/marcas/route.ts`
- Create: `site/src/app/api/admin/fipe/modelos/route.ts`
- Create: `site/src/app/api/admin/fipe/anos/route.ts`
- Create: `site/src/app/api/admin/fipe/valor/route.ts`
- Test: `site/tests/app/api/admin/fipe.test.ts`

**Interfaces:**
- Consumes: `fetchFipeBrands`, `fetchFipeModels`, `fetchFipeYears`, `fetchFipeValue` from `@/lib/fipe`; `createServerSupabaseClient` from `@/lib/supabase/server` (same pattern as `src/app/api/admin/placas/route.ts`).
- Produces: `GET /api/admin/fipe/marcas`, `GET /api/admin/fipe/modelos?marca=`, `GET /api/admin/fipe/anos?marca=&modelo=`, `GET /api/admin/fipe/valor?marca=&modelo=&ano=` — each returns 401 unauthenticated, 400 missing params, 502 on FIPE failure, 200 with the mapped data otherwise.

- [ ] **Step 1: Write the failing tests**

```ts
// site/tests/app/api/admin/fipe.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipeValue } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchFipeBrands: vi.fn(),
  fetchFipeModels: vi.fn(),
  fetchFipeYears: vi.fn(),
  fetchFipeValue: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser } })),
}))

vi.mock('@/lib/fipe', () => ({
  fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipeValue,
  FipeError: class FipeError extends Error {},
}))

import { GET as GET_MARCAS } from '@/app/api/admin/fipe/marcas/route'
import { GET as GET_MODELOS } from '@/app/api/admin/fipe/modelos/route'
import { GET as GET_ANOS } from '@/app/api/admin/fipe/anos/route'
import { GET as GET_VALOR } from '@/app/api/admin/fipe/valor/route'

beforeEach(() => {
  getUser.mockReset()
  fetchFipeBrands.mockReset()
  fetchFipeModels.mockReset()
  fetchFipeYears.mockReset()
  fetchFipeValue.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
})

describe('GET /api/admin/fipe/marcas', () => {
  it('returns 401 without an authenticated session', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } })
    const response = await GET_MARCAS()
    expect(response.status).toBe(401)
  })

  it('returns the brand list', async () => {
    fetchFipeBrands.mockResolvedValueOnce([{ code: '21', name: 'Fiat' }])
    const response = await GET_MARCAS()
    expect(await response.json()).toEqual([{ code: '21', name: 'Fiat' }])
  })

  it('returns 502 when the FIPE client throws', async () => {
    fetchFipeBrands.mockRejectedValueOnce(new Error('boom'))
    const response = await GET_MARCAS()
    expect(response.status).toBe(502)
  })
})

describe('GET /api/admin/fipe/modelos', () => {
  it('returns 400 when marca is missing', async () => {
    const response = await GET_MODELOS(new Request('http://localhost/api/admin/fipe/modelos'))
    expect(response.status).toBe(400)
  })

  it('returns the model list for the given marca', async () => {
    fetchFipeModels.mockResolvedValueOnce([{ code: '437', name: '147 C/ CL' }])
    const response = await GET_MODELOS(new Request('http://localhost/api/admin/fipe/modelos?marca=21'))
    expect(fetchFipeModels).toHaveBeenCalledWith('21')
    expect(await response.json()).toEqual([{ code: '437', name: '147 C/ CL' }])
  })
})

describe('GET /api/admin/fipe/anos', () => {
  it('returns 400 when marca or modelo is missing', async () => {
    const response = await GET_ANOS(new Request('http://localhost/api/admin/fipe/anos?marca=21'))
    expect(response.status).toBe(400)
  })

  it('returns the year list for the given marca/modelo', async () => {
    fetchFipeYears.mockResolvedValueOnce([{ code: '1987-1', name: '1987 Gasolina' }])
    const response = await GET_ANOS(new Request('http://localhost/api/admin/fipe/anos?marca=21&modelo=437'))
    expect(fetchFipeYears).toHaveBeenCalledWith('21', '437')
    expect(await response.json()).toEqual([{ code: '1987-1', name: '1987 Gasolina' }])
  })
})

describe('GET /api/admin/fipe/valor', () => {
  it('returns 400 when any of marca/modelo/ano is missing', async () => {
    const response = await GET_VALOR(new Request('http://localhost/api/admin/fipe/valor?marca=21&modelo=437'))
    expect(response.status).toBe(400)
  })

  it('returns the value for the given marca/modelo/ano', async () => {
    fetchFipeValue.mockResolvedValueOnce({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' })
    const response = await GET_VALOR(new Request('http://localhost/api/admin/fipe/valor?marca=21&modelo=437&ano=1987-1'))
    expect(fetchFipeValue).toHaveBeenCalledWith('21', '437', '1987-1')
    expect(await response.json()).toEqual({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' })
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/app/api/admin/fipe.test.ts`
Expected: FAIL — the four route modules don't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/app/api/admin/fipe/marcas/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeBrands } from '@/lib/fipe'

export async function GET() {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const brands = await fetchFipeBrands()
    return NextResponse.json(brands)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar as marcas na FIPE.' }, { status: 502 })
  }
}
```

```ts
// site/src/app/api/admin/fipe/modelos/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeModels } from '@/lib/fipe'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const marca = new URL(request.url).searchParams.get('marca')
  if (!marca) return NextResponse.json({ error: 'Informe a marca.' }, { status: 400 })

  try {
    const models = await fetchFipeModels(marca)
    return NextResponse.json(models)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar os modelos na FIPE.' }, { status: 502 })
  }
}
```

```ts
// site/src/app/api/admin/fipe/anos/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeYears } from '@/lib/fipe'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const marca = params.get('marca')
  const modelo = params.get('modelo')
  if (!marca || !modelo) return NextResponse.json({ error: 'Informe marca e modelo.' }, { status: 400 })

  try {
    const years = await fetchFipeYears(marca, modelo)
    return NextResponse.json(years)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar os anos na FIPE.' }, { status: 502 })
  }
}
```

```ts
// site/src/app/api/admin/fipe/valor/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeValue } from '@/lib/fipe'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const marca = params.get('marca')
  const modelo = params.get('modelo')
  const ano = params.get('ano')
  if (!marca || !modelo || !ano) return NextResponse.json({ error: 'Informe marca, modelo e ano.' }, { status: 400 })

  try {
    const value = await fetchFipeValue(marca, modelo, ano)
    return NextResponse.json(value)
  } catch {
    return NextResponse.json({ error: 'Não foi possível consultar o preço na FIPE.' }, { status: 502 })
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/app/api/admin/fipe.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/fipe tests/app/api/admin/fipe.test.ts
git commit -m "feat(estoque): add authenticated FIPE proxy API routes"
```

---

### Task 13: `VehicleExpensesEditor.tsx`

**Files:**
- Create: `site/src/components/admin/VehicleExpensesEditor.tsx`
- Test: `site/tests/components/admin/VehicleExpensesEditor.test.tsx`

**Interfaces:**
- Consumes: `VEHICLE_EXPENSE_CATEGORIES` from `@/lib/vehicle-costs`; `VehicleExpenseCategory` from `@/lib/types`; `formatPriceFromCents` from `@/lib/format`.
- Produces: `DraftVehicleExpense{category, description, amountReais}`, `VehicleExpensesEditor({expenses, onChange}): JSX.Element`.

- [ ] **Step 1: Write the failing component test**

```tsx
// site/tests/components/admin/VehicleExpensesEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { VehicleExpensesEditor, type DraftVehicleExpense } from '@/components/admin/VehicleExpensesEditor'

function Harness({ initial = [] as DraftVehicleExpense[] }) {
  const [expenses, setExpenses] = useState<DraftVehicleExpense[]>(initial)
  return <VehicleExpensesEditor expenses={expenses} onChange={setExpenses} />
}

describe('VehicleExpensesEditor', () => {
  it('adds a new expense row with the "Adicionar gasto" button', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    expect(screen.getByLabelText(/categoria do gasto 1/i)).toBeInTheDocument()
  })

  it('shows the description field only when category is "Outros"', () => {
    render(<Harness initial={[{ category: 'pintura', description: '', amountReais: '' }]} />)
    expect(screen.queryByLabelText(/descrição do gasto 1/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/categoria do gasto 1/i), { target: { value: 'outros' } })
    expect(screen.getByLabelText(/descrição do gasto 1/i)).toBeInTheDocument()
  })

  it('removes an expense row', () => {
    render(<Harness initial={[{ category: 'pintura', description: '', amountReais: '100' }]} />)
    fireEvent.click(screen.getByRole('button', { name: /remover/i }))
    expect(screen.queryByLabelText(/categoria do gasto 1/i)).not.toBeInTheDocument()
  })

  it('shows the sum of all expense amounts', () => {
    render(<Harness initial={[
      { category: 'pintura', description: '', amountReais: '500' },
      { category: 'mecanica', description: '', amountReais: '250' },
    ]} />)
    expect(screen.getByText(/total de gastos: r\$ 750/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleExpensesEditor.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/VehicleExpensesEditor'`.

- [ ] **Step 3: Write the component**

```tsx
// site/src/components/admin/VehicleExpensesEditor.tsx
'use client'

import { VEHICLE_EXPENSE_CATEGORIES } from '@/lib/vehicle-costs'
import type { VehicleExpenseCategory } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'

export interface DraftVehicleExpense {
  category: VehicleExpenseCategory
  description: string
  amountReais: string
}

interface VehicleExpensesEditorProps {
  expenses: DraftVehicleExpense[]
  onChange: (expenses: DraftVehicleExpense[]) => void
}

const inputClass =
  'rounded-lg border border-support-gray/25 p-2 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'

export function VehicleExpensesEditor({ expenses, onChange }: VehicleExpensesEditorProps) {
  function addExpense() {
    onChange([...expenses, { category: 'pintura', description: '', amountReais: '' }])
  }

  function updateExpense(index: number, patch: Partial<DraftVehicleExpense>) {
    onChange(expenses.map((expense, i) => (i === index ? { ...expense, ...patch } : expense)))
  }

  function removeExpense(index: number) {
    onChange(expenses.filter((_, i) => i !== index))
  }

  const totalCents = expenses.reduce((sum, expense) => sum + Math.round((Number(expense.amountReais) || 0) * 100), 0)

  return (
    <div className="flex flex-col gap-3">
      {expenses.map((expense, index) => (
        <div key={index} className="grid grid-cols-1 gap-2 rounded-lg bg-support-gray/5 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            aria-label={`Categoria do gasto ${index + 1}`}
            value={expense.category}
            onChange={(e) => updateExpense(index, { category: e.target.value as VehicleExpenseCategory })}
            className={inputClass}
          >
            {VEHICLE_EXPENSE_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {expense.category === 'outros' && (
            <input
              aria-label={`Descrição do gasto ${index + 1}`}
              value={expense.description}
              onChange={(e) => updateExpense(index, { description: e.target.value })}
              placeholder="Descreva o gasto"
              className={inputClass}
            />
          )}
          <input
            aria-label={`Valor do gasto ${index + 1}`}
            type="number"
            value={expense.amountReais}
            onChange={(e) => updateExpense(index, { amountReais: e.target.value })}
            placeholder="Valor (R$)"
            className={inputClass}
          />
          <button type="button" onClick={() => removeExpense(index)} className="text-sm text-aguiar-red hover:underline">
            Remover
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addExpense}
        className="self-start rounded-lg border border-support-gray/25 px-4 py-2 text-sm font-bold text-graphite hover:border-graphite"
      >
        + Adicionar gasto
      </button>

      <p className="text-sm text-support-gray">Total de gastos: {formatPriceFromCents(totalCents)}</p>
    </div>
  )
}
```

- [ ] **Step 4: Run the component test to confirm it passes**

Run: `cd site && npx vitest run tests/components/admin/VehicleExpensesEditor.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/VehicleExpensesEditor.tsx tests/components/admin/VehicleExpensesEditor.test.tsx
git commit -m "feat(estoque): add expenses editor component"
```

---

### Task 14: `VehicleFipeSection.tsx` — cascading FIPE lookup

**Files:**
- Create: `site/src/components/admin/VehicleFipeSection.tsx`
- Test: `site/tests/components/admin/VehicleFipeSection.test.tsx`

**Interfaces:**
- Consumes: `formatPriceFromCents` from `@/lib/format`.
- Produces: `FipeSelection{brandCode, modelCode, yearCode, valueCents, fetchedAt}`, `VehicleFipeSection({initialValueCents?, initialFetchedAt?, onSelect}): JSX.Element`.

- [ ] **Step 1: Write the failing component test**

```tsx
// site/tests/components/admin/VehicleFipeSection.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { VehicleFipeSection } from '@/components/admin/VehicleFipeSection'

describe('VehicleFipeSection', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/marcas')) return new Response(JSON.stringify([{ code: '21', name: 'Fiat' }]), { status: 200 })
      if (url.includes('/modelos')) return new Response(JSON.stringify([{ code: '437', name: '147 C/ CL' }]), { status: 200 })
      if (url.includes('/anos')) return new Response(JSON.stringify([{ code: '1987-1', name: '1987 Gasolina' }]), { status: 200 })
      if (url.includes('/valor')) return new Response(JSON.stringify({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' }), { status: 200 })
      throw new Error(`unexpected url ${url}`)
    }) as any
  })

  it('walks marca -> modelo -> ano and reports the fetched value via onSelect', async () => {
    const onSelect = vi.fn()
    render(<VehicleFipeSection onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /buscar na fipe/i }))

    // Wait for each `<option>` to actually be in the DOM before firing change —
    // setting a <select>'s value to one with no matching <option> yet resets it
    // to "" instead (per the HTMLSelectElement spec), so firing too early would
    // silently make selectBrand("")/selectModel("") no-ops.
    await screen.findByRole('option', { name: 'Fiat' })
    fireEvent.change(screen.getByLabelText(/marca fipe/i), { target: { value: '21' } })
    await screen.findByRole('option', { name: '147 C/ CL' })
    fireEvent.change(screen.getByLabelText(/modelo fipe/i), { target: { value: '437' } })
    await screen.findByRole('option', { name: '1987 Gasolina' })
    fireEvent.change(screen.getByLabelText(/ano fipe/i), { target: { value: '1987-1' } })

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ brandCode: '21', modelCode: '437', yearCode: '1987-1', valueCents: 614700 }),
    ))
    expect(await screen.findByText(/último valor/i)).toBeInTheDocument()
  })

  it('shows the initial cached value without requiring a new lookup', () => {
    render(<VehicleFipeSection onSelect={vi.fn()} initialValueCents={500000} initialFetchedAt="2026-08-01T12:00:00.000Z" />)
    expect(screen.getByText(/último valor/i)).toBeInTheDocument()
  })

  it('shows an error message when the value lookup fails', async () => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/marcas')) return new Response(JSON.stringify([{ code: '21', name: 'Fiat' }]), { status: 200 })
      if (url.includes('/modelos')) return new Response(JSON.stringify([{ code: '437', name: '147 C/ CL' }]), { status: 200 })
      if (url.includes('/anos')) return new Response(JSON.stringify([{ code: '1987-1', name: '1987 Gasolina' }]), { status: 200 })
      return new Response(JSON.stringify({ error: 'boom' }), { status: 502 })
    }) as any

    render(<VehicleFipeSection onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /buscar na fipe/i }))
    await screen.findByRole('option', { name: 'Fiat' })
    fireEvent.change(screen.getByLabelText(/marca fipe/i), { target: { value: '21' } })
    await screen.findByRole('option', { name: '147 C/ CL' })
    fireEvent.change(screen.getByLabelText(/modelo fipe/i), { target: { value: '437' } })
    await screen.findByRole('option', { name: '1987 Gasolina' })
    fireEvent.change(screen.getByLabelText(/ano fipe/i), { target: { value: '1987-1' } })

    expect(await screen.findByText(/não foi possível consultar/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleFipeSection.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the component**

```tsx
// site/src/components/admin/VehicleFipeSection.tsx
'use client'

import { useEffect, useState } from 'react'
import { formatPriceFromCents } from '@/lib/format'

export interface FipeSelection {
  brandCode: string
  modelCode: string
  yearCode: string
  valueCents: number
  fetchedAt: string
}

interface FipeOption { code: string; name: string }

interface VehicleFipeSectionProps {
  initialValueCents?: number | null
  initialFetchedAt?: string | null
  onSelect: (selection: FipeSelection) => void
}

const inputClass =
  'rounded-lg border border-support-gray/25 p-2 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'

export function VehicleFipeSection({ initialValueCents, initialFetchedAt, onSelect }: VehicleFipeSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [brands, setBrands] = useState<FipeOption[]>([])
  const [models, setModels] = useState<FipeOption[]>([])
  const [years, setYears] = useState<FipeOption[]>([])
  const [brandCode, setBrandCode] = useState('')
  const [modelCode, setModelCode] = useState('')
  const [valueCents, setValueCents] = useState<number | null | undefined>(initialValueCents)
  const [fetchedAt, setFetchedAt] = useState<string | null | undefined>(initialFetchedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!expanded || brands.length > 0) return
    setLoading(true)
    setError(null)
    fetch('/api/admin/fipe/marcas')
      .then((response) => response.json())
      .then((data) => setBrands(data))
      .catch(() => setError('Não foi possível carregar as marcas da FIPE.'))
      .finally(() => setLoading(false))
  }, [expanded, brands.length])

  function selectBrand(code: string) {
    setBrandCode(code)
    setModelCode('')
    setModels([])
    setYears([])
    if (!code) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/fipe/modelos?marca=${encodeURIComponent(code)}`)
      .then((response) => response.json())
      .then((data) => setModels(data))
      .catch(() => setError('Não foi possível carregar os modelos da FIPE.'))
      .finally(() => setLoading(false))
  }

  function selectModel(code: string) {
    setModelCode(code)
    setYears([])
    if (!code) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/fipe/anos?marca=${encodeURIComponent(brandCode)}&modelo=${encodeURIComponent(code)}`)
      .then((response) => response.json())
      .then((data) => setYears(data))
      .catch(() => setError('Não foi possível carregar os anos da FIPE.'))
      .finally(() => setLoading(false))
  }

  async function selectYear(code: string) {
    if (!code) return
    setError(null)
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/fipe/valor?marca=${encodeURIComponent(brandCode)}&modelo=${encodeURIComponent(modelCode)}&ano=${encodeURIComponent(code)}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      const nowIso = new Date().toISOString()
      setValueCents(data.valueCents)
      setFetchedAt(nowIso)
      onSelect({ brandCode, modelCode, yearCode: code, valueCents: data.valueCents, fetchedAt: nowIso })
    } catch {
      setError('Não foi possível consultar o preço FIPE.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-support-gray/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Referência FIPE</h3>
        <button type="button" onClick={() => setExpanded(true)} className="text-sm font-bold text-aguiar-red">
          Buscar na FIPE
        </button>
      </div>

      {valueCents != null && (
        <p className="text-sm text-support-gray">
          Último valor: {formatPriceFromCents(valueCents)}
          {fetchedAt ? ` · consultado em ${new Date(fetchedAt).toLocaleDateString('pt-BR')}` : ''}
        </p>
      )}

      {expanded && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fipeBrand" className="text-xs font-bold">Marca FIPE</label>
            <select id="fipeBrand" value={brandCode} onChange={(e) => selectBrand(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {brands.map((brand) => <option key={brand.code} value={brand.code}>{brand.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fipeModel" className="text-xs font-bold">Modelo FIPE</label>
            <select id="fipeModel" value={modelCode} onChange={(e) => selectModel(e.target.value)} disabled={!brandCode} className={inputClass}>
              <option value="">Selecione</option>
              {models.map((model) => <option key={model.code} value={model.code}>{model.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fipeYear" className="text-xs font-bold">Ano FIPE</label>
            <select id="fipeYear" onChange={(e) => selectYear(e.target.value)} disabled={!modelCode} className={inputClass}>
              <option value="">Selecione</option>
              {years.map((year) => <option key={year.code} value={year.code}>{year.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading && <p className="text-xs text-support-gray">Consultando FIPE…</p>}
      {error && <p className="text-sm text-aguiar-red">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/VehicleFipeSection.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/VehicleFipeSection.tsx tests/components/admin/VehicleFipeSection.test.tsx
git commit -m "feat(estoque): add cascading FIPE lookup component"
```

---

### Task 15: `VehicleOptionalsPicker.tsx`

**Files:**
- Create: `site/src/components/admin/VehicleOptionalsPicker.tsx`
- Test: `site/tests/components/admin/VehicleOptionalsPicker.test.tsx`

**Interfaces:**
- Consumes: `VEHICLE_OPTIONALS` from `@/lib/vehicle-optionals`.
- Produces: `VehicleOptionalsPicker({selected, onChange}): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
// site/tests/components/admin/VehicleOptionalsPicker.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { VehicleOptionalsPicker } from '@/components/admin/VehicleOptionalsPicker'

function Harness({ initial = [] as string[] }) {
  const [selected, setSelected] = useState<string[]>(initial)
  return <VehicleOptionalsPicker selected={selected} onChange={setSelected} />
}

describe('VehicleOptionalsPicker', () => {
  it('renders every optional from the fixed catalog as a togglable pill', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Ar condicionado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blindagem' })).toBeInTheDocument()
  })

  it('marks a pill selected (aria-pressed) when clicked, and unselected when clicked again', () => {
    render(<Harness />)
    const pill = screen.getByRole('button', { name: 'Ar condicionado' })
    expect(pill).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-pressed', 'false')
  })

  it('starts with the pills matching the initially selected list', () => {
    render(<Harness initial={['Teto solar']} />)
    expect(screen.getByRole('button', { name: 'Teto solar' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Ar condicionado' })).toHaveAttribute('aria-pressed', 'false')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleOptionalsPicker.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/VehicleOptionalsPicker'`.

- [ ] **Step 3: Write the component**

```tsx
// site/src/components/admin/VehicleOptionalsPicker.tsx
'use client'

import { VEHICLE_OPTIONALS } from '@/lib/vehicle-optionals'

interface VehicleOptionalsPickerProps {
  selected: string[]
  onChange: (next: string[]) => void
}

export function VehicleOptionalsPicker({ selected, onChange }: VehicleOptionalsPickerProps) {
  function toggle(optional: string) {
    onChange(selected.includes(optional) ? selected.filter((o) => o !== optional) : [...selected, optional])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {VEHICLE_OPTIONALS.map((optional) => {
        const active = selected.includes(optional)
        return (
          <button
            key={optional}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(optional)}
            className={`rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
              active ? 'border-aguiar-red bg-aguiar-red text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
            }`}
          >
            {optional}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd site && npx vitest run tests/components/admin/VehicleOptionalsPicker.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/VehicleOptionalsPicker.tsx tests/components/admin/VehicleOptionalsPicker.test.tsx
git commit -m "feat(estoque): add vehicle optionals picker component"
```

---

### Task 16: `VehicleSaleForm.tsx` — sale-capture mini-form

**Files:**
- Create: `site/src/components/admin/VehicleSaleForm.tsx`
- Test: `site/tests/components/admin/VehicleSaleForm.test.tsx`

**Interfaces:**
- Consumes: `adminMarkVehicleSold` from `@/app/actions/vehicles`; `Lead` from `@/lib/types`.
- Produces: `VehicleSaleForm({vehicleId, leads, onCancel, onSaved}): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
// site/tests/components/admin/VehicleSaleForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminMarkVehicleSold } = vi.hoisted(() => ({ adminMarkVehicleSold: vi.fn() }))
vi.mock('@/app/actions/vehicles', () => ({ adminMarkVehicleSold }))

import { VehicleSaleForm } from '@/components/admin/VehicleSaleForm'

const leads = [
  { id: 'lead-1', type: 'financing', name: 'Maria Souza', phone: '11999990000', details: null, vehicle_id: null, created_at: '2026-08-01' },
] as any

describe('VehicleSaleForm', () => {
  beforeEach(() => { adminMarkVehicleSold.mockReset() })

  it('submits sale price, date, and buyer to adminMarkVehicleSold', async () => {
    adminMarkVehicleSold.mockResolvedValue(undefined)
    const onSaved = vi.fn()
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={onSaved} />)

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    fireEvent.change(screen.getByLabelText(/data da venda/i), { target: { value: '2026-08-31' } })
    fireEvent.change(screen.getByLabelText(/comprador/i), { target: { value: 'lead-1' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    await waitFor(() => expect(adminMarkVehicleSold).toHaveBeenCalledWith('v-1', {
      salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: 'lead-1',
    }))
    expect(onSaved).toHaveBeenCalled()
  })

  it('submits without a buyer when none is selected', async () => {
    adminMarkVehicleSold.mockResolvedValue(undefined)
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    fireEvent.change(screen.getByLabelText(/data da venda/i), { target: { value: '2026-08-31' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    await waitFor(() => expect(adminMarkVehicleSold).toHaveBeenCalledWith('v-1', {
      salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: undefined,
    }))
  })

  it('shows an error and does not call onSaved when the action rejects', async () => {
    adminMarkVehicleSold.mockRejectedValue(new Error('boom'))
    const onSaved = vi.fn()
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={onSaved} />)

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    fireEvent.change(screen.getByLabelText(/data da venda/i), { target: { value: '2026-08-31' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    expect(await screen.findByText(/não foi possível registrar a venda/i)).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('calls onCancel when "Cancelar" is clicked', () => {
    const onCancel = vi.fn()
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={onCancel} onSaved={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleSaleForm.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/VehicleSaleForm'`.

- [ ] **Step 3: Write the component**

```tsx
// site/src/components/admin/VehicleSaleForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import type { Lead } from '@/lib/types'
import { adminMarkVehicleSold } from '@/app/actions/vehicles'

interface VehicleSaleFormProps {
  vehicleId: string
  leads: Lead[]
  onCancel: () => void
  onSaved: () => void
}

const inputClass =
  'rounded-lg border border-support-gray/25 p-2 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'

export function VehicleSaleForm({ vehicleId, leads, onCancel, onSaved }: VehicleSaleFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    const salePriceReais = String(formData.get('salePriceReais') || '')
    const soldAt = String(formData.get('soldAt') || '')
    const buyerLeadId = String(formData.get('buyerLeadId') || '')

    setSaving(true)
    try {
      await adminMarkVehicleSold(vehicleId, {
        salePriceCents: Math.round(Number(salePriceReais) * 100),
        soldAt,
        buyerLeadId: buyerLeadId || undefined,
      })
      onSaved()
    } catch {
      setError('Não foi possível registrar a venda. Confira os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg border border-support-gray/25 p-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={`salePriceReais-${vehicleId}`} className="text-sm font-bold">Preço de venda (em reais)</label>
        <input id={`salePriceReais-${vehicleId}`} name="salePriceReais" type="number" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`soldAt-${vehicleId}`} className="text-sm font-bold">Data da venda</label>
        <input id={`soldAt-${vehicleId}`} name="soldAt" type="date" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`buyerLeadId-${vehicleId}`} className="text-sm font-bold">Comprador (opcional)</label>
        <select id={`buyerLeadId-${vehicleId}`} name="buyerLeadId" className={inputClass}>
          <option value="">Sem comprador vinculado</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>{lead.name} — {lead.phone}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-aguiar-red">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-graphite px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-graphite/80 disabled:opacity-50"
        >
          Confirmar venda
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-support-gray/25 px-4 py-2 text-sm font-bold text-graphite hover:border-graphite"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/VehicleSaleForm.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/VehicleSaleForm.tsx tests/components/admin/VehicleSaleForm.test.tsx
git commit -m "feat(estoque): add sale-capture mini-form component"
```

---

### Task 17: `VehicleForm.tsx` — full rewrite (selects, custos, acquired date, opcionais, FIPE)

**Files:**
- Modify: `site/src/components/admin/VehicleForm.tsx` (full-file rewrite — the changes touch every section of the form, so Step 3 gives the complete new file rather than a diff)
- Modify: `site/tests/components/admin/VehicleForm.test.tsx`

**Interfaces:**
- Consumes: `TRANSMISSION_OPTIONS`, `FUEL_TYPE_OPTIONS`, `normalizeFuelType`, `withCurrentValue` from `@/lib/normalize`; `VehicleExpensesEditor`, `DraftVehicleExpense` from `./VehicleExpensesEditor`; `VehicleFipeSection`, `FipeSelection` from `./VehicleFipeSection`; `VehicleOptionalsPicker` from `./VehicleOptionalsPicker`; `calculateTotalCostCents`, `calculateEstimatedMarginCents`, `calculateRealizedMarginCents` from `@/lib/vehicle-costs`; `formatPriceFromCents` from `@/lib/format`.
- Produces: `VehicleForm` now accepts an `expenses?: VehicleExpense[]` prop; its `adminSaveVehicle` payload now includes `transmission`/`fuelType` from fixed selects, `acquisitionCostCents`, `minSalePriceCents`, `acquiredAt`, `expenses`, `fipeBrandCode`/`fipeModelCode`/`fipeYearCode`/`fipeValueCents`/`fipeFetchedAt`, `optionals`.

- [ ] **Step 1: Write the failing tests**

Append to `site/tests/components/admin/VehicleForm.test.tsx`:

```tsx
describe('VehicleForm — câmbio e combustível', () => {
  it('saves the selected câmbio and combustível from the fixed dropdowns', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/câmbio/i), { target: { value: 'Automático' } })
    fireEvent.change(screen.getByLabelText(/^combustível$/i), { target: { value: 'Flex' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ transmission: 'Automático', fuelType: 'Flex' }),
    ))
  })

  it('normalizes the plate lookup fuel type to a fixed option before selecting it', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      brand: 'Fiat', model: 'Argo', fuelType: 'flex',
    }), { status: 200 })) as any

    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/placa/i), { target: { value: 'DEF4G56' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar dados/i }))

    expect(await screen.findByDisplayValue('Fiat')).toBeInTheDocument()
    expect(screen.getByLabelText(/^combustível$/i)).toHaveValue('Flex')
  })

  it("includes the vehicle's existing transmission value as an option even if it predates the fixed list", () => {
    const legacy = { id: 'v-1', brand: 'Fiat', model: 'Argo', transmission: 'Semi-automático' } as any
    render(<VehicleForm vehicle={legacy} />)
    expect(screen.getByRole('option', { name: 'Semi-automático' })).toBeInTheDocument()
  })
})

describe('VehicleForm — custos e data de aquisição', () => {
  it('saves acquisition cost, minimum sale price, and acquired date when filled in', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/custo de aquisição/i), { target: { value: '40000' } })
    fireEvent.change(screen.getByLabelText(/preço mínimo de venda/i), { target: { value: '42000' } })
    fireEvent.change(screen.getByLabelText(/data de aquisição/i), { target: { value: '2026-08-01' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ acquisitionCostCents: 4000000, minSalePriceCents: 4200000, acquiredAt: '2026-08-01' }),
    ))
  })

  it('omits acquisition cost, minimum sale price, and acquired date when left blank', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ acquisitionCostCents: undefined, minSalePriceCents: undefined, acquiredAt: undefined }),
    ))
  })
})

describe('VehicleForm — margem e gastos', () => {
  it('shows the estimated margin as price minus acquisition cost and expenses', () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/custo de aquisição/i), { target: { value: '40000' } })
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    fireEvent.change(screen.getByLabelText(/valor do gasto 1/i), { target: { value: '2000' } })

    expect(screen.getByText(/margem estimada: r\$ 22.900/i)).toBeInTheDocument()
  })

  it('saves the entered expenses with the vehicle', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    fireEvent.change(screen.getByLabelText(/categoria do gasto 1/i), { target: { value: 'lavagem_higienizacao' } })
    fireEvent.change(screen.getByLabelText(/valor do gasto 1/i), { target: { value: '150' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ expenses: [{ category: 'lavagem_higienizacao', description: undefined, amountCents: 15000 }] }),
    ))
  })

  it('shows the realized margin (using the real sale price) once the vehicle is sold', () => {
    const sold = {
      id: 'v-1', brand: 'Fiat', model: 'Argo', price_cents: 6490000, status: 'sold',
      sale_price_cents: 6200000, acquisition_cost_cents: 4000000,
    } as any
    render(<VehicleForm vehicle={sold} />)
    expect(screen.getByText(/margem realizada: r\$ 22.000/i)).toBeInTheDocument()
  })
})

describe('VehicleForm — FIPE', () => {
  it('keeps the vehicle\'s already-saved FIPE data when the FIPE section is left untouched', async () => {
    const vehicle = {
      id: 'v-1', brand: 'Fiat', model: 'Argo',
      fipe_brand_code: '21', fipe_model_code: '437', fipe_year_code: '1987-1',
      fipe_value_cents: 614700, fipe_fetched_at: '2026-08-01T12:00:00.000Z',
    } as any
    render(<VehicleForm vehicle={vehicle} />)
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(expect.objectContaining({
      fipeBrandCode: '21', fipeModelCode: '437', fipeYearCode: '1987-1',
      fipeValueCents: 614700, fipeFetchedAt: '2026-08-01T12:00:00.000Z',
    })))
  })
})

describe('VehicleForm — opcionais', () => {
  it('saves the selected optionals', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ar condicionado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Teto solar' }))

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ optionals: ['Ar condicionado', 'Teto solar'] }),
    ))
  })

  it('pre-selects the pills for a vehicle that already has optionals', () => {
    const vehicle = { id: 'v-1', brand: 'Fiat', model: 'Argo', optionals: ['Blindagem'] } as any
    render(<VehicleForm vehicle={vehicle} />)
    expect(screen.getByRole('button', { name: 'Blindagem' })).toHaveAttribute('aria-pressed', 'true')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleForm.test.tsx`
Expected: FAIL — câmbio/combustível are still `<input>`s, and none of the new labels/sections exist yet.

- [ ] **Step 3: Replace the whole file**

Replace the entire contents of `site/src/components/admin/VehicleForm.tsx` with:

```tsx
'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadVehicleImage, validateImageFile, MAX_VEHICLE_IMAGES } from '@/lib/storage'
import { adminSaveVehicle } from '@/app/actions/vehicles'
import type { Vehicle, VehicleImage, VehicleExpense } from '@/lib/types'
import { TRANSMISSION_OPTIONS, FUEL_TYPE_OPTIONS, normalizeFuelType, withCurrentValue } from '@/lib/normalize'
import { VehicleExpensesEditor, type DraftVehicleExpense } from './VehicleExpensesEditor'
import { VehicleFipeSection, type FipeSelection } from './VehicleFipeSection'
import { VehicleOptionalsPicker } from './VehicleOptionalsPicker'
import { calculateTotalCostCents, calculateEstimatedMarginCents, calculateRealizedMarginCents } from '@/lib/vehicle-costs'
import { formatPriceFromCents } from '@/lib/format'
import { Button } from '@/components/ui/Button'

interface VehicleFormProps {
  vehicle?: Vehicle
  images?: VehicleImage[]
  expenses?: VehicleExpense[]
}

const inputClass =
  'rounded-lg border border-support-gray/25 p-2.5 text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const labelClass = 'text-sm font-bold'

export function VehicleForm({ vehicle, images = [], expenses: initialExpenses = [] }: VehicleFormProps) {
  const router = useRouter()
  const [imagePaths, setImagePaths] = useState<string[]>(images.map((image) => image.storage_path))
  const [error, setError] = useState<string | null>(null)
  const [brand, setBrand] = useState(vehicle?.brand ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [color, setColor] = useState(vehicle?.color ?? '')
  const [fuelType, setFuelType] = useState(vehicle?.fuel_type ?? '')
  const [transmission, setTransmission] = useState(vehicle?.transmission ?? '')
  const [plate, setPlate] = useState(vehicle?.plate ?? '')
  const [plateLookupError, setPlateLookupError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [priceReais, setPriceReais] = useState(vehicle ? String(vehicle.price_cents / 100) : '')
  const [acquisitionCostReais, setAcquisitionCostReais] = useState(
    vehicle?.acquisition_cost_cents != null ? String(vehicle.acquisition_cost_cents / 100) : '',
  )
  const [minSalePriceReais, setMinSalePriceReais] = useState(
    vehicle?.min_sale_price_cents != null ? String(vehicle.min_sale_price_cents / 100) : '',
  )
  const [expenses, setExpenses] = useState<DraftVehicleExpense[]>(
    initialExpenses.map((expense) => ({
      category: expense.category,
      description: expense.description ?? '',
      amountReais: String(expense.amount_cents / 100),
    })),
  )
  const [fipeSelection, setFipeSelection] = useState<FipeSelection | null>(null)
  const [optionals, setOptionals] = useState<string[]>(vehicle?.optionals ?? [])

  async function handlePlateLookup() {
    setPlateLookupError(null)
    const response = await fetch(`/api/admin/placas?plate=${encodeURIComponent(plate)}`)
    const data = await response.json()
    if (!response.ok) {
      setPlateLookupError(data.error ?? 'Não foi possível buscar os dados da placa.')
      return
    }
    setBrand(data.brand)
    setModel(data.model)
    if (data.color) setColor(data.color)
    if (data.fuelType) {
      const normalized = normalizeFuelType(data.fuelType)
      if (normalized) setFuelType(normalized)
    }
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    setImageError(null)

    const remainingSlots = MAX_VEHICLE_IMAGES - imagePaths.length
    if (remainingSlots <= 0) {
      setImageError(`Você já atingiu o limite de ${MAX_VEHICLE_IMAGES} fotos por veículo.`)
      event.target.value = ''
      return
    }

    const accepted: File[] = []
    const rejections: string[] = []
    for (const file of files) {
      const problem = validateImageFile(file)
      if (problem) rejections.push(problem)
      else accepted.push(file)
    }

    const toUpload = accepted.slice(0, remainingSlots)
    if (accepted.length > remainingSlots) {
      rejections.push(
        `Limite de ${MAX_VEHICLE_IMAGES} fotos por veículo: só foi possível adicionar mais ${remainingSlots} ${remainingSlots === 1 ? 'foto' : 'fotos'}.`,
      )
    }
    if (rejections.length > 0) setImageError(rejections.join(' '))
    event.target.value = ''
    if (toUpload.length === 0) return

    const client = createBrowserSupabaseClient()
    const uploaded = await Promise.all(toUpload.map((file) => uploadVehicleImage(client, file)))
    setImagePaths((current) => [...current, ...uploaded])
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImagePaths((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return next
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const totalCostCents = calculateTotalCostCents(
    acquisitionCostReais.trim() ? Math.round(Number(acquisitionCostReais) * 100) : null,
    expenses.map((expense) => ({ amount_cents: Math.round((Number(expense.amountReais) || 0) * 100) })),
  )
  const priceCentsForMargin = Math.round((Number(priceReais) || 0) * 100)
  const showRealizedMargin = vehicle?.status === 'sold' && vehicle.sale_price_cents != null
  const marginCents = showRealizedMargin
    ? calculateRealizedMarginCents(vehicle!.sale_price_cents, totalCostCents)
    : calculateEstimatedMarginCents(priceCentsForMargin, totalCostCents)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await adminSaveVehicle({
        id: vehicle?.id,
        brand,
        model,
        version: String(formData.get('version') || ''),
        yearModel: Number(formData.get('yearModel')),
        yearFabrication: Number(formData.get('yearFabrication')),
        mileageKm: Number(formData.get('mileageKm')),
        priceCents: Math.round(Number(priceReais) * 100),
        fuelType,
        transmission,
        color,
        description: String(formData.get('description') || ''),
        engine: String(formData.get('engine') || ''),
        fuelTankLiters: formData.get('fuelTankLiters') ? Number(formData.get('fuelTankLiters')) : undefined,
        seatingCapacity: formData.get('seatingCapacity') ? Number(formData.get('seatingCapacity')) : undefined,
        bodyType: String(formData.get('bodyType') || ''),
        doors: formData.get('doors') ? Number(formData.get('doors')) : undefined,
        horsepower: formData.get('horsepower') ? Number(formData.get('horsepower')) : undefined,
        plate,
        isFeatured: formData.get('isFeatured') === 'on',
        imagePaths,
        acquisitionCostCents: acquisitionCostReais ? Math.round(Number(acquisitionCostReais) * 100) : undefined,
        minSalePriceCents: minSalePriceReais ? Math.round(Number(minSalePriceReais) * 100) : undefined,
        acquiredAt: String(formData.get('acquiredAt') || '') || undefined,
        expenses: expenses
          .filter((expense) => expense.amountReais.trim() !== '')
          .map((expense) => ({
            category: expense.category,
            description: expense.description || undefined,
            amountCents: Math.round(Number(expense.amountReais) * 100),
          })),
        // Seeded from the vehicle's already-saved FIPE data whenever the FIPE
        // section itself wasn't touched, so an unrelated edit never wipes it.
        fipeBrandCode: fipeSelection?.brandCode ?? vehicle?.fipe_brand_code ?? undefined,
        fipeModelCode: fipeSelection?.modelCode ?? vehicle?.fipe_model_code ?? undefined,
        fipeYearCode: fipeSelection?.yearCode ?? vehicle?.fipe_year_code ?? undefined,
        fipeValueCents: fipeSelection?.valueCents ?? vehicle?.fipe_value_cents ?? undefined,
        fipeFetchedAt: fipeSelection?.fetchedAt ?? vehicle?.fipe_fetched_at ?? undefined,
        optionals,
      })
      router.push('/admin/veiculos')
    } catch {
      setError('Não foi possível salvar o veículo. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1.5 border-b border-support-gray/15 pb-6">
        <label htmlFor="images" className={labelClass}>Fotos do veículo (até {MAX_VEHICLE_IMAGES})</label>
        <input
          id="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={imagePaths.length >= MAX_VEHICLE_IMAGES}
          onChange={handleFilesSelected}
          className="rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite disabled:cursor-not-allowed disabled:opacity-50"
        />
        {imageError && <p className="text-sm text-aguiar-red">{imageError}</p>}
        {imagePaths.length > 0 && (
          <ul className="flex flex-col gap-1">
            {imagePaths.map((path, index) => (
              <li key={path} className="flex items-center gap-2 rounded-lg bg-support-gray/5 px-3 py-2 text-sm">
                <span className="flex-1 truncate">{path}</span>
                <button type="button" onClick={() => moveImage(index, -1)} className="text-support-gray hover:text-graphite">↑</button>
                <button type="button" onClick={() => moveImage(index, 1)} className="text-support-gray hover:text-graphite">↓</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-b border-support-gray/15 pb-6">
        <label htmlFor="plate" className={labelClass}>
          Placa (uso interno, nunca aparece no site)
        </label>
        <div className="flex gap-2">
          <input
            id="plate"
            name="plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Ex.: ABC1D23"
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={handlePlateLookup}
            className="rounded-lg bg-graphite px-4 py-2 font-bold text-white transition-colors hover:bg-graphite/80"
          >
            Buscar dados
          </button>
        </div>
        {plateLookupError && <p className="text-sm text-aguiar-red">{plateLookupError}</p>}
        <p className="text-sm text-support-gray">Confira os campos abaixo antes de salvar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="brand" className={labelClass}>Marca</label>
          <input id="brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="model" className={labelClass}>Modelo</label>
          <input id="model" name="model" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="Ex.: HB20" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="version" className={labelClass}>Versão</label>
          <input id="version" name="version" defaultValue={vehicle?.version ?? ''} placeholder="Ex.: Comfort" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="yearModel" className={labelClass}>Ano do modelo</label>
          <input id="yearModel" name="yearModel" type="number" defaultValue={vehicle?.year_model} required placeholder="Ex.: 2024" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="yearFabrication" className={labelClass}>Ano de fabricação</label>
          <input id="yearFabrication" name="yearFabrication" type="number" defaultValue={vehicle?.year_fabrication} required placeholder="Ex.: 2023" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mileageKm" className={labelClass}>Quilometragem</label>
          <input id="mileageKm" name="mileageKm" type="number" defaultValue={vehicle?.mileage_km} required placeholder="Ex.: 12000" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="color" className={labelClass}>Cor</label>
          <input id="color" name="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ex.: Branco" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="priceReais" className={labelClass}>Preço (em reais)</label>
          <input id="priceReais" name="priceReais" type="number" value={priceReais} onChange={(e) => setPriceReais(e.target.value)} required placeholder="Ex.: 45900" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="transmission" className={labelClass}>Câmbio</label>
          <select id="transmission" name="transmission" value={transmission} onChange={(e) => setTransmission(e.target.value)} className={inputClass}>
            <option value="">Selecione</option>
            {withCurrentValue(TRANSMISSION_OPTIONS, vehicle?.transmission).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fuelType" className={labelClass}>Combustível</label>
          <select id="fuelType" name="fuelType" value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={inputClass}>
            <option value="">Selecione</option>
            {withCurrentValue(FUEL_TYPE_OPTIONS, vehicle?.fuel_type).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="engine" className={labelClass}>Motor</label>
          <input id="engine" name="engine" defaultValue={vehicle?.engine ?? ''} placeholder="Ex.: 1.6" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fuelTankLiters" className={labelClass}>Tanque de combustível (litros)</label>
          <input id="fuelTankLiters" name="fuelTankLiters" type="number" defaultValue={vehicle?.fuel_tank_liters ?? ''} placeholder="Ex.: 55" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="seatingCapacity" className={labelClass}>Quantidade de pessoas</label>
          <input id="seatingCapacity" name="seatingCapacity" type="number" defaultValue={vehicle?.seating_capacity ?? ''} placeholder="Ex.: 5" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bodyType" className={labelClass}>Tipo de carroceria</label>
          <input id="bodyType" name="bodyType" defaultValue={vehicle?.body_type ?? ''} placeholder="Ex.: Hatch" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="doors" className={labelClass}>Portas</label>
          <input id="doors" name="doors" type="number" defaultValue={vehicle?.doors ?? ''} placeholder="Ex.: 4" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="horsepower" className={labelClass}>Potência (hp)</label>
          <input id="horsepower" name="horsepower" type="number" defaultValue={vehicle?.horsepower ?? ''} placeholder="Ex.: 116" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={labelClass}>Descrição</label>
        <textarea id="description" name="description" defaultValue={vehicle?.description ?? ''} rows={3} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="isFeatured" defaultChecked={vehicle?.is_featured} className="h-4 w-4 accent-aguiar-red" />
        Destacar na Home
      </label>

      <div className="flex flex-col gap-3 border-t border-support-gray/15 pt-6">
        <h2 className="text-lg font-bold">Opcionais</h2>
        <VehicleOptionalsPicker selected={optionals} onChange={setOptionals} />
      </div>

      <div className="flex flex-col gap-4 border-t border-support-gray/15 pt-6">
        <h2 className="text-lg font-bold">Custos (uso interno — nunca aparece no site)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="acquisitionCostReais" className={labelClass}>Custo de aquisição (em reais)</label>
            <input id="acquisitionCostReais" type="number" value={acquisitionCostReais} onChange={(e) => setAcquisitionCostReais(e.target.value)} placeholder="Ex.: 40000" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="minSalePriceReais" className={labelClass}>Preço mínimo de venda (em reais)</label>
            <input id="minSalePriceReais" type="number" value={minSalePriceReais} onChange={(e) => setMinSalePriceReais(e.target.value)} placeholder="Ex.: 42000" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="acquiredAt" className={labelClass}>Data de aquisição</label>
            <input id="acquiredAt" name="acquiredAt" type="date" defaultValue={vehicle?.acquired_at ?? ''} className={inputClass} />
          </div>
        </div>

        <VehicleExpensesEditor expenses={expenses} onChange={setExpenses} />
        <p className="text-sm font-bold text-graphite">
          {showRealizedMargin ? 'Margem realizada' : 'Margem estimada'}: {formatPriceFromCents(marginCents ?? 0)}
        </p>

        <VehicleFipeSection
          initialValueCents={vehicle?.fipe_value_cents}
          initialFetchedAt={vehicle?.fipe_fetched_at}
          onSelect={setFipeSelection}
        />
      </div>

      {error && <p className="text-sm text-aguiar-red">{error}</p>}
      <Button type="submit" className="self-start">Salvar</Button>
    </form>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/VehicleForm.test.tsx`
Expected: PASS — including every pre-existing test in this file (all still use the same field labels, just reordered on the page, which Testing Library doesn't care about).

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `cd site && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/VehicleForm.tsx tests/components/admin/VehicleForm.test.tsx
git commit -m "feat(estoque): rebuild VehicleForm with selects, costs, acquired date, opcionais, FIPE"
```

---

### Task 18: Editable stock-turnover threshold in Configurações

**Files:**
- Modify: `site/src/components/admin/SiteSettingsForm.tsx`
- Modify: `site/tests/components/admin/SiteSettingsForm.test.tsx`
- Modify: `site/src/app/admin/(dashboard)/configuracoes/page.tsx`

**Interfaces:**
- Consumes: `adminSetSiteSetting` from `@/app/actions/site-settings` (already generic — no backend change needed); `getSiteSetting` from `@/lib/queries/site-settings`; `parseTurnoverThreshold` from `@/lib/vehicle-stock`.
- Produces: `SiteSettingsForm` now also accepts `stockTurnoverThresholdDays: number` and renders a field for it.

- [ ] **Step 1: Write the failing test**

Append to `site/tests/components/admin/SiteSettingsForm.test.tsx`:

```tsx
it('saves the stock-turnover threshold as a string, in days', async () => {
  render(<SiteSettingsForm locationVideoUrl={null} stockTurnoverThresholdDays={90} />)
  fireEvent.change(screen.getByLabelText(/limiar de giro de estoque/i), { target: { value: '120' } })
  fireEvent.click(screen.getAllByRole('button', { name: /salvar/i })[1])

  await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('stock_turnover_threshold_days', '120'))
})
```

And update the existing `render(<SiteSettingsForm locationVideoUrl={null} />)` call in the file's first test to `render(<SiteSettingsForm locationVideoUrl={null} stockTurnoverThresholdDays={90} />)` (the prop is now required).

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/SiteSettingsForm.test.tsx`
Expected: FAIL — no field labeled "limiar de giro de estoque" exists yet, and the component doesn't accept the new prop.

- [ ] **Step 3: Write the implementation**

Replace the full contents of `site/src/components/admin/SiteSettingsForm.tsx`:

```tsx
'use client'

import type { FormEvent } from 'react'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'

interface SiteSettingsFormProps {
  locationVideoUrl: string | null
  stockTurnoverThresholdDays: number
}

export function SiteSettingsForm({ locationVideoUrl, stockTurnoverThresholdDays }: SiteSettingsFormProps) {
  async function handleLocationVideoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSetSiteSetting('location_video_url', String(formData.get('locationVideoUrl') || ''))
  }

  async function handleTurnoverThresholdSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSetSiteSetting('stock_turnover_threshold_days', String(formData.get('stockTurnoverThresholdDays') || ''))
  }

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <form onSubmit={handleLocationVideoSubmit} className="flex flex-col gap-3">
        <label htmlFor="locationVideoUrl">Vídeo de localização (como chegar)</label>
        <input
          id="locationVideoUrl"
          name="locationVideoUrl"
          defaultValue={locationVideoUrl ?? ''}
          placeholder="https://..."
          className="rounded border p-2 text-graphite"
        />
        <Button type="submit">Salvar</Button>
      </form>

      <form onSubmit={handleTurnoverThresholdSubmit} className="flex flex-col gap-3">
        <label htmlFor="stockTurnoverThresholdDays">Limiar de giro de estoque (dias)</label>
        <p className="text-sm text-support-gray">
          Um veículo disponível aparece na aba &quot;Girar&quot; do Estoque a partir deste número de dias parado.
        </p>
        <input
          id="stockTurnoverThresholdDays"
          name="stockTurnoverThresholdDays"
          type="number"
          min={1}
          defaultValue={stockTurnoverThresholdDays}
          className="rounded border p-2 text-graphite"
        />
        <Button type="submit">Salvar</Button>
      </form>
    </div>
  )
}
```

Replace the full contents of `site/src/app/admin/(dashboard)/configuracoes/page.tsx`:

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { parseTurnoverThreshold } from '@/lib/vehicle-stock'
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm'

export default async function AdminConfiguracoesPage() {
  const client = await createServerSupabaseClient()
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')
  const stockTurnoverThresholdDays = parseTurnoverThreshold(await getSiteSetting(client, 'stock_turnover_threshold_days'))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Configurações</h1>
      <SiteSettingsForm locationVideoUrl={locationVideoUrl} stockTurnoverThresholdDays={stockTurnoverThresholdDays} />
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/SiteSettingsForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/SiteSettingsForm.tsx tests/components/admin/SiteSettingsForm.test.tsx "src/app/admin/(dashboard)/configuracoes/page.tsx"
git commit -m "feat(estoque): make the stock-turnover threshold editable in Configurações"
```

---

### Task 19: `VehicleStockCard.tsx`

**Files:**
- Create: `site/src/components/admin/VehicleStockCard.tsx`
- Test: `site/tests/components/admin/VehicleStockCard.test.tsx`

**Interfaces:**
- Consumes: `Vehicle`, `Lead` from `@/lib/types`; `formatPriceFromCents` from `@/lib/format`; `calculateEstimatedMarginCents`, `calculateRealizedMarginCents` from `@/lib/vehicle-costs`; `daysInStock`, `hasMarginDefined` from `@/lib/vehicle-stock`; `adminDeleteVehicle`, `adminSetVehicleFeatured`, `adminSetVehicleStatus` from `@/app/actions/vehicles`; `VehicleSaleForm` from `./VehicleSaleForm`.
- Produces: `VehicleStockCard({vehicle, coverImageUrl?, totalCostCents, thresholdDays, leads}): JSX.Element`.

- [ ] **Step 1: Write the failing tests**

```tsx
// site/tests/components/admin/VehicleStockCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } = vi.hoisted(() => ({
  adminDeleteVehicle: vi.fn(),
  adminSetVehicleFeatured: vi.fn(),
  adminSetVehicleStatus: vi.fn(),
}))
vi.mock('@/app/actions/vehicles', () => ({ adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus, adminMarkVehicleSold: vi.fn() }))
vi.spyOn(window, 'confirm').mockReturnValue(true)

import { VehicleStockCard } from '@/components/admin/VehicleStockCard'

const NOW = new Date('2026-09-01T12:00:00.000Z')

function makeVehicle(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', color: 'Branco',
    year_model: 2023, mileage_km: 32000, price_cents: 6490000,
    status: 'available', is_featured: false,
    acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, acquired_at: null, created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as any
}

describe('VehicleStockCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // VehicleStockCard calls daysInStock(vehicle) with no explicit `now`, so it
    // falls back to `new Date()` — fake the clock rather than let this test's
    // pass/fail depend on which real-world day it happens to run on.
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => vi.useRealTimers())

  it('shows a "Definir margem" pill when acquisition cost or minimum price is missing', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    expect(screen.getByRole('link', { name: /definir margem/i })).toHaveAttribute('href', '/admin/veiculos/v-1')
  })

  it('shows the minimum-price band with custo/lucro once a margin is defined', () => {
    const vehicle = makeVehicle({ acquisition_cost_cents: 4568600, min_sale_price_cents: 5549000 })
    render(<VehicleStockCard vehicle={vehicle} totalCostCents={4568600} thresholdDays={90} leads={[]} />)
    expect(screen.getByText(/mínimo à vista r\$ 55.490/i)).toBeInTheDocument()
    expect(screen.getByText(/custo r\$ 45.686/i)).toBeInTheDocument()
    expect(screen.getByText(/lucro r\$ 19.214/i)).toBeInTheDocument()
  })

  it('shows the days-in-stock badge, computed from acquired_at', () => {
    render(<VehicleStockCard vehicle={makeVehicle({ acquired_at: '2026-08-01' })} totalCostCents={0} thresholdDays={90} leads={[]} />)
    expect(screen.getByText('31 dias')).toBeInTheDocument()
  })

  it('deletes the vehicle on confirm', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(adminDeleteVehicle).toHaveBeenCalledWith('v-1')
  })

  it('toggles destaque', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /destacar/i }))
    expect(adminSetVehicleFeatured).toHaveBeenCalledWith('v-1', true)
  })

  it('moves an available vehicle to preparing and back', () => {
    render(<VehicleStockCard vehicle={makeVehicle({ status: 'available' })} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar em preparação/i }))
    expect(adminSetVehicleStatus).toHaveBeenCalledWith('v-1', 'preparing')
  })

  it('shows the sale form when "Marcar como vendido" is clicked, and hides the trigger', () => {
    render(<VehicleStockCard vehicle={makeVehicle()} totalCostCents={0} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar como vendido/i }))
    expect(screen.getByLabelText(/preço de venda/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como vendido/i })).not.toBeInTheDocument()
  })

  it('offers "Marcar como disponível" (not the sale form) for an already-sold vehicle', () => {
    render(<VehicleStockCard vehicle={makeVehicle({ status: 'sold', sale_price_cents: 6200000 })} totalCostCents={0} thresholdDays={90} leads={[]} />)
    expect(screen.getByRole('button', { name: /marcar como disponível/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como vendido/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleStockCard.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/VehicleStockCard'`.

- [ ] **Step 3: Write the component**

```tsx
// site/src/components/admin/VehicleStockCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPriceFromCents } from '@/lib/format'
import type { Vehicle, Lead } from '@/lib/types'
import { calculateEstimatedMarginCents, calculateRealizedMarginCents } from '@/lib/vehicle-costs'
import { daysInStock, hasMarginDefined } from '@/lib/vehicle-stock'
import { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } from '@/app/actions/vehicles'
import { VehicleSaleForm } from './VehicleSaleForm'

interface VehicleStockCardProps {
  vehicle: Vehicle
  coverImageUrl?: string
  totalCostCents: number
  thresholdDays: number
  leads: Lead[]
}

export function VehicleStockCard({ vehicle, coverImageUrl, totalCostCents, thresholdDays, leads }: VehicleStockCardProps) {
  const [showSaleForm, setShowSaleForm] = useState(false)
  const days = daysInStock(vehicle)
  const isStale = vehicle.status === 'available' && days >= thresholdDays
  const marginDefined = hasMarginDefined(vehicle)
  const marginCents = vehicle.status === 'sold'
    ? calculateRealizedMarginCents(vehicle.sale_price_cents, totalCostCents)
    : calculateEstimatedMarginCents(vehicle.price_cents, totalCostCents)

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-support-gray/10">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-support-gray">Sem foto</div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-bold text-white ${isStale ? 'bg-aguiar-red' : 'bg-graphite'}`}>
          {days} {days === 1 ? 'dia' : 'dias'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="font-bold">{vehicle.brand} {vehicle.model} {vehicle.version}</p>
          <p className="text-sm text-support-gray">
            {vehicle.year_model} · {vehicle.mileage_km.toLocaleString('pt-BR')} km · {vehicle.color}
          </p>
        </div>

        <p className="text-sm text-support-gray">Tabela {formatPriceFromCents(vehicle.price_cents)}</p>

        {marginDefined ? (
          <div className="rounded-lg bg-green-50 p-2">
            <div className="flex items-center justify-between text-sm font-bold text-green-700">
              <span>Mínimo à vista {formatPriceFromCents(vehicle.min_sale_price_cents!)}</span>
              <span>-{formatPriceFromCents(vehicle.price_cents - vehicle.min_sale_price_cents!)}</span>
            </div>
            <p className="mt-1 text-xs text-support-gray">
              Custo {formatPriceFromCents(totalCostCents)} · {vehicle.status === 'sold' ? 'Lucro realizado' : 'Lucro'} {formatPriceFromCents(marginCents ?? 0)}
            </p>
          </div>
        ) : (
          <Link
            href={`/admin/veiculos/${vehicle.id}`}
            className="rounded-lg bg-yellow-100 px-3 py-2 text-center text-sm font-bold text-yellow-800"
          >
            Definir margem
          </Link>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-sm">
          <Link href={`/admin/veiculos/${vehicle.id}`} className="font-bold text-graphite hover:underline">Editar</Link>
          {vehicle.status !== 'sold' && !showSaleForm && (
            <button type="button" onClick={() => setShowSaleForm(true)} className="font-bold text-graphite hover:underline">
              Marcar como vendido
            </button>
          )}
          {vehicle.status === 'sold' && (
            <button type="button" onClick={() => adminSetVehicleStatus(vehicle.id, 'available')} className="font-bold text-graphite hover:underline">
              Marcar como disponível
            </button>
          )}
          {vehicle.status === 'available' && (
            <button type="button" onClick={() => adminSetVehicleStatus(vehicle.id, 'preparing')} className="text-support-gray hover:text-graphite">
              Marcar em preparação
            </button>
          )}
          {vehicle.status === 'preparing' && (
            <button type="button" onClick={() => adminSetVehicleStatus(vehicle.id, 'available')} className="text-support-gray hover:text-graphite">
              Marcar disponível
            </button>
          )}
          <button type="button" onClick={() => adminSetVehicleFeatured(vehicle.id, !vehicle.is_featured)} className="text-support-gray hover:text-graphite">
            {vehicle.is_featured ? 'Remover destaque' : 'Destacar'}
          </button>
          <button
            type="button"
            onClick={() => { if (window.confirm('Excluir este veículo?')) adminDeleteVehicle(vehicle.id) }}
            className="text-aguiar-red hover:underline"
          >
            Excluir
          </button>
        </div>

        {showSaleForm && (
          <VehicleSaleForm
            vehicleId={vehicle.id}
            leads={leads}
            onCancel={() => setShowSaleForm(false)}
            onSaved={() => setShowSaleForm(false)}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/VehicleStockCard.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/VehicleStockCard.tsx tests/components/admin/VehicleStockCard.test.tsx
git commit -m "feat(estoque): add VehicleStockCard with margin/lucro highlight and quick actions"
```

---

### Task 20: `VehicleStockGrid.tsx` — filter tabs, search, card grid

**Files:**
- Create: `site/src/components/admin/VehicleStockGrid.tsx`
- Test: `site/tests/components/admin/VehicleStockGrid.test.tsx`

**Interfaces:**
- Consumes: `Vehicle`, `Lead` from `@/lib/types`; `countStockFilters`, `applyStockFilter`, `matchesStockSearch`, `type StockFilter` from `@/lib/vehicle-stock`; `calculateTotalCostCents` from `@/lib/vehicle-costs`; `VehicleStockCard` from `./VehicleStockCard`.
- Produces: `VehicleStockGrid({vehicles, coverImageUrls, expenseTotalsCents, thresholdDays, leads}): JSX.Element`.

- [ ] **Step 1: Write the failing tests**

```tsx
// site/tests/components/admin/VehicleStockGrid.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/app/actions/vehicles', () => ({
  adminDeleteVehicle: vi.fn(), adminSetVehicleFeatured: vi.fn(), adminSetVehicleStatus: vi.fn(), adminMarkVehicleSold: vi.fn(),
}))

import { VehicleStockGrid } from '@/components/admin/VehicleStockGrid'

const NOW = new Date('2026-09-01T12:00:00.000Z')

function makeVehicle(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: overrides.id ?? 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', color: 'Branco',
    year_model: 2023, mileage_km: 32000, price_cents: 6490000,
    status: 'available', is_featured: false,
    acquisition_cost_cents: null, min_sale_price_cents: null,
    sale_price_cents: null, acquired_at: null, created_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as any
}

describe('VehicleStockGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  const vehicles = [
    makeVehicle({ id: 'a', brand: 'Fiat', model: 'Argo', status: 'available', acquisition_cost_cents: 100, min_sale_price_cents: 200 }),
    makeVehicle({ id: 'b', brand: 'Volkswagen', model: 'Polo', status: 'available' }),
    makeVehicle({ id: 'c', brand: 'Toyota', model: 'Corolla', status: 'preparing' }),
  ]

  it('shows every vehicle under "Todos" with the correct count', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    expect(screen.getByRole('button', { name: /todos \(3\)/i })).toBeInTheDocument()
    expect(screen.getByText(/fiat argo/i)).toBeInTheDocument()
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument()
  })

  it('filters to only vehicles without a margin when "Sem margem" is clicked', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /sem margem/i }))
    expect(screen.queryByText(/fiat argo/i)).not.toBeInTheDocument()
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument()
  })

  it('filters to only preparing vehicles when "Em preparação" is clicked', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /em preparação/i }))
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument()
    expect(screen.queryByText(/fiat argo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/volkswagen polo/i)).not.toBeInTheDocument()
  })

  it('shows the configured threshold in the "Girar" tab label', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={120} leads={[]} />)
    expect(screen.getByRole('button', { name: /girar \(\+120d\)/i })).toBeInTheDocument()
  })

  it('filters by free-text search across brand and model', () => {
    render(<VehicleStockGrid vehicles={vehicles} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    fireEvent.change(screen.getByLabelText(/buscar veículo/i), { target: { value: 'polo' } })
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.queryByText(/fiat argo/i)).not.toBeInTheDocument()
  })

  it('passes the cover image URL and combined total cost (acquisition + expenses) down to each card', () => {
    const priced = [makeVehicle({ id: 'a', acquisition_cost_cents: 100000, min_sale_price_cents: 200000 })]
    render(
      <VehicleStockGrid
        vehicles={priced}
        coverImageUrls={{ a: 'https://example.com/a.jpg' }}
        expenseTotalsCents={{ a: 5000 }}
        thresholdDays={90}
        leads={[]}
      />,
    )
    expect(screen.getByRole('img', { name: /fiat argo/i })).toHaveAttribute('src', 'https://example.com/a.jpg')
    // totalCostCents = 100000 (acquisition) + 5000 (expenses) = 105000 = R$ 1.050
    expect(screen.getByText(/custo r\$ 1.050/i)).toBeInTheDocument()
  })

  it('shows an empty state when no vehicle matches the active filter', () => {
    render(<VehicleStockGrid vehicles={[]} coverImageUrls={{}} expenseTotalsCents={{}} thresholdDays={90} leads={[]} />)
    expect(screen.getByText(/nenhum veículo encontrado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleStockGrid.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/VehicleStockGrid'`.

- [ ] **Step 3: Write the component**

```tsx
// site/src/components/admin/VehicleStockGrid.tsx
'use client'

import { useState } from 'react'
import type { Vehicle, Lead } from '@/lib/types'
import { countStockFilters, applyStockFilter, matchesStockSearch, type StockFilter } from '@/lib/vehicle-stock'
import { calculateTotalCostCents } from '@/lib/vehicle-costs'
import { VehicleStockCard } from './VehicleStockCard'

interface VehicleStockGridProps {
  vehicles: Vehicle[]
  coverImageUrls: Record<string, string>
  expenseTotalsCents: Record<string, number>
  thresholdDays: number
  leads: Lead[]
}

export function VehicleStockGrid({ vehicles, coverImageUrls, expenseTotalsCents, thresholdDays, leads }: VehicleStockGridProps) {
  const [filter, setFilter] = useState<StockFilter>('all')
  const [search, setSearch] = useState('')

  const counts = countStockFilters(vehicles, thresholdDays)
  const filtered = applyStockFilter(vehicles, filter, thresholdDays).filter((vehicle) => matchesStockSearch(vehicle, search))

  const tabs: { value: StockFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: counts.all },
    { value: 'no_margin', label: 'Sem margem', count: counts.no_margin },
    { value: 'turnover', label: `Girar (+${thresholdDays}d)`, count: counts.turnover },
    { value: 'preparing', label: 'Em preparação', count: counts.preparing },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
              filter === tab.value ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por marca, modelo, versão ou cor..."
        aria-label="Buscar veículo"
        className="mb-4 w-full max-w-md rounded-lg border border-support-gray/25 p-2.5 text-graphite transition-colors focus:border-aguiar-red focus:outline-none"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((vehicle) => (
          <VehicleStockCard
            key={vehicle.id}
            vehicle={vehicle}
            coverImageUrl={coverImageUrls[vehicle.id]}
            totalCostCents={calculateTotalCostCents(vehicle.acquisition_cost_cents, [
              { amount_cents: expenseTotalsCents[vehicle.id] ?? 0 },
            ])}
            thresholdDays={thresholdDays}
            leads={leads}
          />
        ))}
      </div>

      {filtered.length === 0 && <p className="mt-6 text-sm text-support-gray">Nenhum veículo encontrado.</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/VehicleStockGrid.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/VehicleStockGrid.tsx tests/components/admin/VehicleStockGrid.test.tsx
git commit -m "feat(estoque): add VehicleStockGrid with filter tabs and search"
```

---

### Task 21: Wire the grid and expenses into the admin pages; retire `VehicleTable`

**Files:**
- Modify: `site/src/app/admin/(dashboard)/veiculos/page.tsx`
- Modify: `site/src/app/admin/(dashboard)/veiculos/[id]/page.tsx`
- Delete: `site/src/components/admin/VehicleTable.tsx`
- Delete: `site/tests/components/admin/VehicleTable.test.tsx`

**Interfaces:**
- Consumes: `getAllVehiclesAdmin` from `@/lib/queries/vehicles`; `getPrimaryImageUrlsByVehicleIds` from `@/lib/queries/vehicle-images`; `getVehicleExpenseTotals`, `getVehicleExpenses` from `@/lib/queries/vehicle-expenses`; `getAllLeadsAdmin` from `@/lib/queries/leads`; `getSiteSetting` from `@/lib/queries/site-settings`; `parseTurnoverThreshold` from `@/lib/vehicle-stock`; `VehicleStockGrid` from `@/components/admin/VehicleStockGrid`.
- Produces: no new exports — this task is page-level wiring, not unit-tested directly (matches the existing convention: admin pages in this codebase have no dedicated test file, only their child components do).

This task has no new automated test of its own — every piece of logic it wires together (`VehicleStockGrid`, `getVehicleExpenseTotals`, `getPrimaryImageUrlsByVehicleIds`, `getVehicleExpenses`, `VehicleForm`) already has full test coverage from Tasks 9, 17, and 20. Verify it manually in Step 4 instead.

- [ ] **Step 1: Rewrite the Estoque listing page**

Replace the full contents of `site/src/app/admin/(dashboard)/veiculos/page.tsx`:

```tsx
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'
import { getVehicleExpenseTotals } from '@/lib/queries/vehicle-expenses'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { parseTurnoverThreshold } from '@/lib/vehicle-stock'
import { VehicleStockGrid } from '@/components/admin/VehicleStockGrid'

export default async function AdminVeiculosPage() {
  const client = await createServerSupabaseClient()
  const vehicles = await getAllVehiclesAdmin(client)
  const vehicleIds = vehicles.map((vehicle) => vehicle.id)

  const [coverImageUrls, expenseTotalsCents, leads, thresholdSetting] = await Promise.all([
    getPrimaryImageUrlsByVehicleIds(client, vehicleIds),
    getVehicleExpenseTotals(client, vehicleIds),
    getAllLeadsAdmin(client),
    getSiteSetting(client, 'stock_turnover_threshold_days'),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <Link
          href="/admin/veiculos/novo"
          className="rounded-lg bg-aguiar-red px-5 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          Cadastrar veículo
        </Link>
      </div>
      <VehicleStockGrid
        vehicles={vehicles}
        coverImageUrls={coverImageUrls}
        expenseTotalsCents={expenseTotalsCents}
        thresholdDays={parseTurnoverThreshold(thresholdSetting)}
        leads={leads}
      />
    </div>
  )
}
```

- [ ] **Step 2: Pass expenses into the edit form**

Replace the full contents of `site/src/app/admin/(dashboard)/veiculos/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleByIdAdmin } from '@/lib/queries/vehicles'
import { getVehicleImages } from '@/lib/queries/vehicle-images'
import { getVehicleExpenses } from '@/lib/queries/vehicle-expenses'
import { VehicleForm } from '@/components/admin/VehicleForm'

interface EditVehiclePageProps {
  params: Promise<{ id: string }>
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleByIdAdmin(client, id)
  if (!vehicle) notFound()
  const [images, expenses] = await Promise.all([
    getVehicleImages(client, id),
    getVehicleExpenses(client, id),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Editar veículo</h1>
      <VehicleForm vehicle={vehicle} images={images} expenses={expenses} />
    </div>
  )
}
```

`site/src/app/admin/(dashboard)/veiculos/novo/page.tsx` needs no change: `VehicleForm` is called with no props there, and every new field defaults to empty/undefined.

- [ ] **Step 3: Delete the superseded `VehicleTable`**

`VehicleStockGrid`/`VehicleStockCard` (Tasks 19–20) fully replace it — same delete/destaque/status actions, plus margin, photo, and filter behavior it never had. Delete both files:

```bash
git rm site/src/components/admin/VehicleTable.tsx site/tests/components/admin/VehicleTable.test.tsx
```

- [ ] **Step 4: Manually verify in the browser**

Run: `cd site && npm run dev`, sign in as admin, open `/admin/veiculos`.
Expected: the grid renders with filter tabs and counts, cards show cover photos (or "Sem foto"), "Definir margem" appears for vehicles without cost data, editing a vehicle that has saved expenses shows them pre-filled in the "Custos" section, and `/admin/veiculos/novo` still creates a vehicle successfully.

Also open `/admin/veiculos/novo` and test the "Buscar dados" plate lookup with a real plate against the live `apiplacas.com.br` integration (unit tests mock this network call, so this is the one manual check nothing automated covers) — confirm it still fills marca/modelo/cor/combustível as it did before this branch was reset.

- [ ] **Step 5: Run the full test suite**

Run: `cd site && npm test`
Expected: PASS — no leftover references to the deleted `VehicleTable`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(dashboard)/veiculos/page.tsx" "src/app/admin/(dashboard)/veiculos/[id]/page.tsx"
git commit -m "feat(estoque): wire VehicleStockGrid and expenses into the admin pages, retire VehicleTable"
```

---

### Task 22: Regression test — financial/FIPE/acquisition/optionals fields never leak to the public site

**Files:**
- Create: `site/tests/lib/queries/vehicles-public-leak.test.ts`

**Interfaces:**
- Consumes: nothing from the app — reads the raw migration SQL files from disk.
- Produces: no exports; a standalone guard test.

- [ ] **Step 1: Write the test**

```ts
// site/tests/lib/queries/vehicles-public-leak.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const SENSITIVE_COLUMNS = [
  'plate',
  'acquired_at',
  'acquisition_cost_cents',
  'min_sale_price_cents',
  'sale_price_cents',
  'sold_at',
  'buyer_lead_id',
  'fipe_brand_code',
  'fipe_model_code',
  'fipe_year_code',
  'fipe_value_cents',
  'fipe_fetched_at',
  'optionals',
]

function readLatestVehiclesPublicViewDefinition(): string {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  const files = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()
  let combinedSql = ''
  for (const file of files) combinedSql += readFileSync(join(migrationsDir, file), 'utf-8') + '\n'

  // The view could in principle be recreated in a later migration (`create or
  // replace view`) — the LAST such block in migration order is what's actually
  // live, so that's what this guard checks, not just the first `create view`.
  const matches = [...combinedSql.matchAll(/create (?:or replace )?view vehicles_public as([\s\S]*?);/gi)]
  expect(matches.length).toBeGreaterThan(0)
  return matches[matches.length - 1][1]
}

describe('vehicles_public view — financial/internal data guard', () => {
  it('never selects any cost, sale, FIPE, acquisition-date, optionals, or plate column', () => {
    const viewDefinition = readLatestVehiclesPublicViewDefinition()
    for (const column of SENSITIVE_COLUMNS) {
      expect(viewDefinition).not.toContain(column)
    }
  })
})
```

- [ ] **Step 2: Run it to confirm it currently passes**

Run: `cd site && npx vitest run tests/lib/queries/vehicles-public-leak.test.ts`
Expected: PASS immediately — this is a regression guard for a property that should already hold given Tasks 1–21 never touched `vehicles_public`; it exists to fail loudly if a future change adds one of these columns to that view by mistake.

- [ ] **Step 3: Run the full suite one last time**

Run: `cd site && npm test`
Expected: PASS, entire suite.

- [ ] **Step 4: Commit**

```bash
git add tests/lib/queries/vehicles-public-leak.test.ts
git commit -m "test(estoque): guard against cost/FIPE/acquisition/optionals fields leaking to the public site"
```

---

## After all tasks

The Estoque sub-project (costs, expenses, margin, FIPE, sale capture, optionals, preparing status, editable turnover threshold, and the card-grid listing) is functionally complete and fully tested at this point. Its visual styling follows existing Tailwind conventions but does **not** attempt to pixel-match the reference mockup images — that was a deliberate scope cut (see Global Constraints) to keep this plan focused on correctness.

The next step, once this plan is fully executed and the user has looked at it running in the browser, is a **separate, iterative visual-polish pass**: comparing the live `VehicleForm` and `VehicleStockGrid` against the reference images field-by-field and section-by-section, and adjusting spacing/borders/colors/card layout to match — the same two-phase approach (functional plan, then pixel-matching pass) that worked for this sub-project's first implementation attempt. Do not fold that work into this plan; it is inherently visual/iterative and doesn't fit the TDD task structure above.

Sub-projects 2–6 (Leads/CRM funil kanban, Painel, Agenda, Metas, Relatórios) remain unplanned — each needs its own spec (via `superpowers:brainstorming`) and plan (via `superpowers:writing-plans`) once Estoque is done and reviewed.

