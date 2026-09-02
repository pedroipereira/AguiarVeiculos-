# Leads/CRM Kanban Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain Leads table at `/admin/leads` with a 6-column kanban board (one column per `lead_stage`), where each card shows contact/vehicle/notes/dates and supports drag-and-drop or a menu to move stages, plus WhatsApp, edit, and delete actions — with moving a vehicle-linked lead to "Vendeu" completing the vehicle sale in the same flow.

**Architecture:** One new DB column (`leads.notes`) plus two new RLS policies (leads never had update/delete access for admins — only select/insert). New pure logic lives in `src/lib/lead-kanban.ts` (stage order/labels, grouping, WhatsApp link, date formatting — all unit-testable without React). New/modified components (`LeadCard`, `LeadKanbanBoard`, extended `LeadQuickAddModal`, extended `VehicleSaleForm`) follow the existing admin component conventions exactly (direct server-action calls from click handlers, `window.confirm` for destructive actions, Tailwind class constants). Drag-and-drop uses `@dnd-kit/core` only (no `@dnd-kit/sortable` — in-column order is fixed, not user-sortable, so the extra package would be unused weight).

**Tech Stack:** Next.js 15 (App Router), React 19, Supabase (Postgres + Auth), Zod, Vitest + Testing Library. New dependencies: `@dnd-kit/core@6.3.1`, `@dnd-kit/utilities@3.2.2`.

**Spec:** `docs/superpowers/specs/2026-09-02-leads-crm-kanban-design.md`

## Global Constraints

- `notes` (nullable text) is the only new database column — everything else the board needs (`stage`, the four date columns, `vehicle_id`) already exists since migration 0006.
- `leads` currently has RLS policies for `select` (authenticated) and `insert` (anon + authenticated) only — no `update`/`delete` policy exists yet, so without a new migration every stage move, edit, and delete would silently fail under RLS.
- The kanban board **replaces** the Leads table outright — no list/kanban toggle. `LeadTable.tsx` and its test are deleted once nothing references it.
- Deletion is permanent (`window.confirm` then a real `delete`) — no soft delete/archive column.
- The WhatsApp button opens `https://wa.me/55<digits>` with no pre-filled message text.
- In-column order is whatever order the caller's leads array already has (`getAllLeadsAdmin` sorts newest-first) — no drag-to-reorder within a column, so `@dnd-kit/sortable` is not used, only `@dnd-kit/core`.
- Moving a lead to `vendeu`: if it has no `vehicle_id`, the stage changes immediately. If it has a `vehicle_id`, the stage does **not** change yet — a `VehicleSaleForm` modal opens first, and the stage only moves to `vendeu` once that form's sale is saved. Cancelling the modal leaves the lead in its original stage.
- Every new/modified server action re-checks auth via `assertAdmin` (`src/lib/actions/assert-admin.ts`), matching every other admin action.
- No test may depend on network access — mock `global.fetch`/the Supabase client/the `@/app/actions/*` modules, matching the existing test patterns in this codebase (`vi.mock`, `vi.hoisted`).
- Date-only columns (`first_contact_at`, `store_visit_at`, `scheduled_visit_date`) are Postgres `date` values (`YYYY-MM-DD` strings) — never format them with `new Date(str).toLocaleDateString()`, which rolls back a day in timezones behind UTC. Use the new `formatIsoDate` string helper instead (Task 3).

---

### Task 1: Migration — `leads.notes` column and write policies

**Files:**
- Create: `site/supabase/migrations/0007_leads_notes_and_write_policies.sql`

**Interfaces:**
- Produces: column `leads.notes` (text, nullable); RLS policies `"admin update access to leads"`, `"admin delete access to leads"`.

- [ ] **Step 1: Write the migration**

```sql
-- Free-text notes for a lead, edited via the kanban card's edit modal and
-- shown directly on the card.
alter table leads add column notes text;

-- `leads` only had "admin read" (select) and "anyone can insert" policies
-- (RLS default-denies everything else) — the kanban board needs to move a
-- lead between funnel stages, edit its fields, and delete it.
create policy "admin update access to leads" on leads
  for update to authenticated using (true) with check (true);
create policy "admin delete access to leads" on leads
  for delete to authenticated using (true);
```

- [ ] **Step 2: Apply it locally and confirm it runs clean**

Run: `cd site && npx supabase db reset` (reapplies every migration from scratch against the local stack)
Expected: no errors; `leads` has a `notes` column; `select policyname from pg_policies where tablename = 'leads'` (via local Studio or `npx supabase db execute --local "select policyname from pg_policies where tablename = 'leads'"`) lists 4 policies including the two new ones.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0007_leads_notes_and_write_policies.sql
git commit -m "feat(db): add leads.notes column and admin update/delete policies"
```

---

### Task 2: Types (`src/lib/types.ts`)

**Files:**
- Modify: `site/src/lib/types.ts:92-105`

**Interfaces:**
- Produces: `Lead.notes: string | null`.

- [ ] **Step 1: Add the field**

Replace:

```ts
export interface Lead {
  id: string
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown> | null
  vehicle_id: string | null
  stage: LeadStage
  first_contact_at: string | null
  store_visit_at: string | null
  scheduled_visit_date: string | null
  scheduled_visit_time: string | null
  created_at: string
}
```

with:

```ts
export interface Lead {
  id: string
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown> | null
  vehicle_id: string | null
  stage: LeadStage
  first_contact_at: string | null
  store_visit_at: string | null
  scheduled_visit_date: string | null
  scheduled_visit_time: string | null
  notes: string | null
  created_at: string
}
```

- [ ] **Step 2: Verify the project still typechecks**

Run: `cd site && npx tsc --noEmit`
Expected: PASS (this task only widens a type; nothing consumes `notes` yet).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(leads): add notes field to Lead type"
```

---

### Task 3: Kanban helper logic (`src/lib/lead-kanban.ts`)

**Files:**
- Create: `site/src/lib/lead-kanban.ts`
- Test: `site/tests/lib/lead-kanban.test.ts`

**Interfaces:**
- Consumes: `Lead`, `LeadStage` from `./types`.
- Produces: `LEAD_STAGES: LeadStage[]`, `LEAD_STAGE_LABELS: Record<LeadStage, string>`, `groupLeadsByStage(leads: Lead[]): Record<LeadStage, Lead[]>`, `requiresSaleCompletion(lead: Pick<Lead, 'vehicle_id'>, targetStage: LeadStage): boolean`, `buildWhatsAppLink(phone: string): string`, `formatIsoDate(value: string): string`.

- [ ] **Step 1: Write the failing tests**

```ts
// site/tests/lib/lead-kanban.test.ts
import { describe, it, expect } from 'vitest'
import {
  LEAD_STAGES, LEAD_STAGE_LABELS, groupLeadsByStage, requiresSaleCompletion, buildWhatsAppLink, formatIsoDate,
} from '@/lib/lead-kanban'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('LEAD_STAGES / LEAD_STAGE_LABELS', () => {
  it('has one label per stage, in the funnel order', () => {
    expect(LEAD_STAGES).toEqual(['novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou'])
    expect(Object.keys(LEAD_STAGE_LABELS)).toHaveLength(LEAD_STAGES.length)
  })
})

describe('groupLeadsByStage', () => {
  it('buckets leads into all 6 stages, with empty arrays for stages with no leads', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' }), makeLead({ id: 'b', stage: 'vendeu' })]
    const groups = groupLeadsByStage(leads)
    expect(groups.novo.map((l) => l.id)).toEqual(['a'])
    expect(groups.vendeu.map((l) => l.id)).toEqual(['b'])
    expect(groups.negociando).toEqual([])
  })

  it('preserves the input order within each column', () => {
    const leads = [
      makeLead({ id: 'first', stage: 'novo', created_at: '2026-09-01T10:00:00.000Z' }),
      makeLead({ id: 'second', stage: 'novo', created_at: '2026-08-30T10:00:00.000Z' }),
    ]
    expect(groupLeadsByStage(leads).novo.map((l) => l.id)).toEqual(['first', 'second'])
  })
})

describe('requiresSaleCompletion', () => {
  it('is true when moving to "vendeu" a lead with a linked vehicle', () => {
    expect(requiresSaleCompletion({ vehicle_id: 'v-1' }, 'vendeu')).toBe(true)
  })

  it('is false when moving to "vendeu" a lead with no linked vehicle', () => {
    expect(requiresSaleCompletion({ vehicle_id: null }, 'vendeu')).toBe(false)
  })

  it('is false when moving to any other stage, even with a linked vehicle', () => {
    expect(requiresSaleCompletion({ vehicle_id: 'v-1' }, 'negociando')).toBe(false)
  })
})

describe('buildWhatsAppLink', () => {
  it('strips formatting and prefixes the Brazil country code', () => {
    expect(buildWhatsAppLink('(98) 99999-9999')).toBe('https://wa.me/5598999999999')
  })

  it('leaves already-bare digits untouched aside from the prefix', () => {
    expect(buildWhatsAppLink('98999999999')).toBe('https://wa.me/5598999999999')
  })
})

describe('formatIsoDate', () => {
  it('reformats an ISO date to dd/mm/yyyy without going through Date (no timezone shift)', () => {
    expect(formatIsoDate('2026-09-01')).toBe('01/09/2026')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/lead-kanban.test.ts`
Expected: FAIL — `Cannot find module '@/lib/lead-kanban'`.

- [ ] **Step 3: Write the implementation**

```ts
// site/src/lib/lead-kanban.ts
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
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/lead-kanban.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/lead-kanban.ts tests/lib/lead-kanban.test.ts
git commit -m "feat(leads): add kanban stage grouping, sale-completion, and formatting helpers"
```

---

### Task 4: Validation — `notes` on `manualLeadSchema` (`src/lib/validation.ts`)

**Files:**
- Modify: `site/src/lib/validation.ts:75-85`
- Test: `site/tests/lib/validation.test.ts`

**Interfaces:**
- Produces: `manualLeadSchema` gains an optional `notes: string` field; `ManualLeadValues` gains `notes?: string`.

- [ ] **Step 1: Write the failing tests**

Add `manualLeadSchema` to the existing import line in `site/tests/lib/validation.test.ts` (currently `import { vehicleFormSchema, financingLeadSchema, tradeInLeadSchema, vehicleExpenseSchema, markVehicleSoldSchema } from '@/lib/validation'`), then append:

```ts
describe('manualLeadSchema', () => {
  it('accepts a full payload including notes', () => {
    const result = manualLeadSchema.parse({
      name: 'Maria', phone: '98999999999', vehicleId: '11111111-1111-1111-1111-111111111111',
      stage: 'negociando', notes: 'Quer trocar o carro atual', firstContactAt: '2026-09-01',
    })
    expect(result.notes).toBe('Quer trocar o carro atual')
  })

  it('accepts a minimal payload without notes', () => {
    const result = manualLeadSchema.parse({ name: 'João', phone: '98988888888' })
    expect(result.notes).toBeUndefined()
  })

  it('rejects a name shorter than 2 characters', () => {
    expect(manualLeadSchema.safeParse({ name: 'J', phone: '98988888888' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/validation.test.ts`
Expected: FAIL — `manualLeadSchema` accepts `notes` today because Zod strips unknown keys by default, but `result.notes` would be `undefined` even when passed... actually confirm by running: the *first* test fails because `.notes` is stripped (not present in the parsed shape at all, so `toBe('...')` fails).

- [ ] **Step 3: Write the implementation**

Replace:

```ts
export const manualLeadSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  phone: z.string().min(1, 'Informe o telefone'),
  vehicleId: z.string().uuid().optional(),
  stage: z.enum(['novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou']).optional(),
  firstContactAt: z.string().optional(),
  storeVisitAt: z.string().optional(),
  scheduledVisitDate: z.string().optional(),
  scheduledVisitTime: z.string().optional(),
})
export type ManualLeadValues = z.infer<typeof manualLeadSchema>
```

with:

```ts
export const manualLeadSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  phone: z.string().min(1, 'Informe o telefone'),
  vehicleId: z.string().uuid().optional(),
  stage: z.enum(['novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou']).optional(),
  notes: z.string().optional(),
  firstContactAt: z.string().optional(),
  storeVisitAt: z.string().optional(),
  scheduledVisitDate: z.string().optional(),
  scheduledVisitTime: z.string().optional(),
})
export type ManualLeadValues = z.infer<typeof manualLeadSchema>
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `cd site && npm test`
Expected: PASS (`notes` is optional, so every existing caller of `manualLeadSchema` is unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation.ts tests/lib/validation.test.ts
git commit -m "feat(leads): add notes field to manualLeadSchema"
```

---

### Task 5: `lib/actions/leads.ts` — update, stage change, delete

**Files:**
- Modify: `site/src/lib/actions/leads.ts`
- Test: `site/tests/lib/actions/leads.test.ts`

**Interfaces:**
- Consumes: `LeadStage` from `../types` (already imported).
- Produces: `UpdateLeadInput`, `updateLead(client, id, input): Promise<void>`, `updateLeadStage(client, id, stage): Promise<void>`, `deleteLead(client, id): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

Update the top import line of `site/tests/lib/actions/leads.test.ts` from `import { createLead } from '@/lib/actions/leads'` to:

```ts
import { createLead, updateLead, updateLeadStage, deleteLead } from '@/lib/actions/leads'
```

Then append:

```ts
describe('updateLead', () => {
  it('updates the lead row with the given fields', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await updateLead(client as any, 'l-1', {
      name: 'Maria', phone: '98999999999', vehicleId: 'v-1', stage: 'negociando',
      notes: 'Ligar amanhã', firstContactAt: '2026-09-01',
    })
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.update).toHaveBeenCalledWith({
      name: 'Maria', phone: '98999999999', vehicle_id: 'v-1', stage: 'negociando',
      notes: 'Ligar amanhã', first_contact_at: '2026-09-01', store_visit_at: null,
      scheduled_visit_date: null, scheduled_visit_time: null,
    })
    expect(chain.eq).toHaveBeenCalledWith('id', 'l-1')
  })

  it('writes null for vehicle, notes, and dates when omitted, and defaults stage to novo', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await updateLead(client as any, 'l-1', { name: 'João', phone: '98988888888' })
    expect(chain.update).toHaveBeenCalledWith({
      name: 'João', phone: '98988888888', vehicle_id: null, stage: 'novo', notes: null,
      first_contact_at: null, store_visit_at: null, scheduled_visit_date: null, scheduled_visit_time: null,
    })
  })

  it('throws when the update fails', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: { message: 'row-level security violation' } })) }
    const client = { from: vi.fn(() => chain) }
    await expect(updateLead(client as any, 'l-1', { name: 'Ana', phone: '98977777777' })).rejects.toEqual({ message: 'row-level security violation' })
  })
})

describe('updateLeadStage', () => {
  it('updates only the stage column', async () => {
    const chain: any = { update: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await updateLeadStage(client as any, 'l-1', 'vendeu')
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.update).toHaveBeenCalledWith({ stage: 'vendeu' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'l-1')
  })
})

describe('deleteLead', () => {
  it('deletes the lead row', async () => {
    const chain: any = { delete: vi.fn(() => chain), eq: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await deleteLead(client as any, 'l-1')
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'l-1')
  })

  it('throws when the delete fails', async () => {
    const chain: any = { delete: vi.fn(() => chain), eq: vi.fn(async () => ({ error: { message: 'row-level security violation' } })) }
    const client = { from: vi.fn(() => chain) }
    await expect(deleteLead(client as any, 'l-1')).rejects.toEqual({ message: 'row-level security violation' })
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/lib/actions/leads.test.ts`
Expected: FAIL — `updateLead`/`updateLeadStage`/`deleteLead` not exported.

- [ ] **Step 3: Write the implementation**

Append to `site/src/lib/actions/leads.ts`:

```ts
export interface UpdateLeadInput {
  name: string
  phone: string
  vehicleId?: string
  stage?: LeadStage
  notes?: string
  firstContactAt?: string
  storeVisitAt?: string
  scheduledVisitDate?: string
  scheduledVisitTime?: string
}

export async function updateLead(client: SupabaseClient, id: string, input: UpdateLeadInput): Promise<void> {
  const { error } = await client
    .from('leads')
    .update({
      name: input.name,
      phone: input.phone,
      vehicle_id: input.vehicleId ?? null,
      stage: input.stage ?? 'novo',
      notes: input.notes ?? null,
      first_contact_at: input.firstContactAt ?? null,
      store_visit_at: input.storeVisitAt ?? null,
      scheduled_visit_date: input.scheduledVisitDate ?? null,
      scheduled_visit_time: input.scheduledVisitTime ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function updateLeadStage(client: SupabaseClient, id: string, stage: LeadStage): Promise<void> {
  const { error } = await client.from('leads').update({ stage }).eq('id', id)
  if (error) throw error
}

export async function deleteLead(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('leads').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/lib/actions/leads.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/leads.ts tests/lib/actions/leads.test.ts
git commit -m "feat(leads): add updateLead, updateLeadStage, and deleteLead actions"
```

---

### Task 6: `app/actions/leads.ts` — server action wrappers

**Files:**
- Modify: `site/src/app/actions/leads.ts`

**Interfaces:**
- Consumes: `updateLead`, `updateLeadStage`, `deleteLead` from `@/lib/actions/leads`; `manualLeadSchema`, `ManualLeadValues` from `@/lib/validation` (already imported); `LeadStage` from `@/lib/types`.
- Produces: `adminUpdateLead(id, input): Promise<void>`, `adminUpdateLeadStage(id, stage): Promise<void>`, `adminDeleteLead(id): Promise<void>`.

No dedicated test file — this file is a thin `assertAdmin` + `revalidatePath` wrapper with no branching logic of its own (same as `adminCreateManualLead` above it, which also has no direct test); it's exercised indirectly through the component tests in Tasks 9–11, which mock this module the same way `LeadQuickAddModal.test.tsx` already mocks `adminCreateManualLead`.

- [ ] **Step 1: Update the imports**

Replace:

```ts
import { createLead } from '@/lib/actions/leads'
import {
  financingLeadSchema,
  tradeInLeadSchema,
  manualLeadSchema,
  type FinancingLeadValues,
  type TradeInLeadValues,
  type ManualLeadValues,
} from '@/lib/validation'
```

with:

```ts
import { createLead, updateLead, updateLeadStage, deleteLead } from '@/lib/actions/leads'
import {
  financingLeadSchema,
  tradeInLeadSchema,
  manualLeadSchema,
  type FinancingLeadValues,
  type TradeInLeadValues,
  type ManualLeadValues,
} from '@/lib/validation'
import type { LeadStage } from '@/lib/types'
```

- [ ] **Step 2: Add the new server actions**

Append to `site/src/app/actions/leads.ts`:

```ts
export async function adminUpdateLead(id: string, input: ManualLeadValues) {
  const values = manualLeadSchema.parse(input)
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await updateLead(client, id, {
    name: values.name,
    phone: values.phone,
    vehicleId: values.vehicleId,
    stage: values.stage,
    notes: values.notes,
    firstContactAt: values.firstContactAt,
    storeVisitAt: values.storeVisitAt,
    scheduledVisitDate: values.scheduledVisitDate,
    scheduledVisitTime: values.scheduledVisitTime,
  })
  revalidatePath('/admin/leads')
}

export async function adminUpdateLeadStage(id: string, stage: LeadStage) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await updateLeadStage(client, id, stage)
  revalidatePath('/admin/leads')
}

export async function adminDeleteLead(id: string) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await deleteLead(client, id)
  revalidatePath('/admin/leads')
}
```

- [ ] **Step 3: Verify the project still typechecks**

Run: `cd site && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/leads.ts
git commit -m "feat(leads): add adminUpdateLead, adminUpdateLeadStage, adminDeleteLead server actions"
```

---

### Task 7: `VehicleSaleForm.tsx` — `defaultBuyerLeadId` prop

**Files:**
- Modify: `site/src/components/admin/VehicleSaleForm.tsx`
- Test: `site/tests/components/admin/VehicleSaleForm.test.tsx`

**Interfaces:**
- Produces: `VehicleSaleFormProps.defaultBuyerLeadId?: string`.

- [ ] **Step 1: Write the failing test**

Append to `site/tests/components/admin/VehicleSaleForm.test.tsx`:

```ts
it('pre-selects the buyer when defaultBuyerLeadId is given', () => {
  render(<VehicleSaleForm vehicleId="v-1" leads={leads} defaultBuyerLeadId="lead-1" onCancel={vi.fn()} onSaved={vi.fn()} />)
  expect(screen.getByLabelText(/comprador/i)).toHaveValue('lead-1')
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleSaleForm.test.tsx`
Expected: FAIL — the select has no `defaultBuyerLeadId` prop wired up, so its value stays empty (`''`).

- [ ] **Step 3: Write the implementation**

Replace:

```tsx
interface VehicleSaleFormProps {
  vehicleId: string
  leads: Lead[]
  onCancel: () => void
  onSaved: () => void
}
```

with:

```tsx
interface VehicleSaleFormProps {
  vehicleId: string
  leads: Lead[]
  defaultBuyerLeadId?: string
  onCancel: () => void
  onSaved: () => void
}
```

Replace:

```tsx
export function VehicleSaleForm({ vehicleId, leads, onCancel, onSaved }: VehicleSaleFormProps) {
```

with:

```tsx
export function VehicleSaleForm({ vehicleId, leads, defaultBuyerLeadId, onCancel, onSaved }: VehicleSaleFormProps) {
```

Replace:

```tsx
        <select id={`buyerLeadId-${vehicleId}`} name="buyerLeadId" className={inputClass}>
```

with:

```tsx
        <select id={`buyerLeadId-${vehicleId}`} name="buyerLeadId" defaultValue={defaultBuyerLeadId ?? ''} className={inputClass}>
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/VehicleSaleForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/VehicleSaleForm.tsx tests/components/admin/VehicleSaleForm.test.tsx
git commit -m "feat(leads): let VehicleSaleForm pre-select a default buyer lead"
```

---

### Task 8: Install `@dnd-kit/core` and `@dnd-kit/utilities`

**Files:**
- Modify: `site/package.json:12-13` (dependencies block)

**Interfaces:**
- Produces: `@dnd-kit/core@6.3.1`, `@dnd-kit/utilities@3.2.2` available for import.

- [ ] **Step 1: Add the dependencies**

In `site/package.json`, insert into the `"dependencies"` block (before `"@supabase/ssr"`, keeping alphabetical order):

```json
    "@dnd-kit/core": "6.3.1",
    "@dnd-kit/utilities": "3.2.2",
```

- [ ] **Step 2: Install and verify the lockfile updates**

Run: `cd site && npm install`
Expected: exits 0; `package-lock.json` gains entries for `@dnd-kit/core`, `@dnd-kit/utilities`, and their transitive deps (`@dnd-kit/accessibility`, `tslib`).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(leads): add @dnd-kit/core and @dnd-kit/utilities dependencies"
```

---

### Task 9: `LeadQuickAddModal.tsx` — edit mode + Observações field

**Files:**
- Modify: `site/src/components/admin/LeadQuickAddModal.tsx`
- Test: `site/tests/components/admin/LeadQuickAddModal.test.tsx`

**Interfaces:**
- Consumes: `adminUpdateLead` from `@/app/actions/leads` (Task 6); `Lead` from `@/lib/types`.
- Produces: `LeadQuickAddModalProps.lead?: Lead` — when present, the form is pre-filled and submits via `adminUpdateLead` instead of `adminCreateManualLead`, and the default title becomes "Editar lead".

- [ ] **Step 1: Write the failing tests**

Update the mock at the top of `site/tests/components/admin/LeadQuickAddModal.test.tsx` from:

```ts
const { adminCreateManualLead } = vi.hoisted(() => ({ adminCreateManualLead: vi.fn() }))
vi.mock('@/app/actions/leads', () => ({ adminCreateManualLead }))
```

to:

```ts
const { adminCreateManualLead, adminUpdateLead } = vi.hoisted(() => ({ adminCreateManualLead: vi.fn(), adminUpdateLead: vi.fn() }))
vi.mock('@/app/actions/leads', () => ({ adminCreateManualLead, adminUpdateLead }))
```

(The file already has `beforeEach(() => vi.clearAllMocks())` as the first line inside `describe('LeadQuickAddModal', () => { ... })` — no change needed there.)

Then append these tests:

```ts
it('collects observações text on create', async () => {
  render(<LeadQuickAddModal vehicles={[]} onClose={vi.fn()} />)
  fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Pedro' } })
  fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '98911112222' } })
  fireEvent.change(screen.getByLabelText(/observações/i), { target: { value: 'Quer um SUV' } })
  fireEvent.click(screen.getByRole('button', { name: /salvar lead/i }))

  await waitFor(() =>
    expect(adminCreateManualLead).toHaveBeenCalledWith(expect.objectContaining({ notes: 'Quer um SUV' })),
  )
})

it('pre-fills the form and calls adminUpdateLead when a lead is provided (edit mode)', async () => {
  const lead = {
    id: 'l-1', type: 'manual', name: 'Carlos', phone: '98977776666', details: null,
    vehicle_id: 'v-1', stage: 'negociando', first_contact_at: '2026-09-01', store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: 'Já visitou a loja',
    created_at: '2026-08-01T10:00:00.000Z',
  } as any
  const onClose = vi.fn()
  render(<LeadQuickAddModal vehicles={VEHICLES} lead={lead} onClose={onClose} />)

  expect(screen.getByText('Editar lead')).toBeInTheDocument()
  expect(screen.getByLabelText(/^nome$/i)).toHaveValue('Carlos')
  expect(screen.getByLabelText(/telefone/i)).toHaveValue('98977776666')
  expect(screen.getByLabelText(/observações/i)).toHaveValue('Já visitou a loja')

  fireEvent.click(screen.getByRole('button', { name: /salvar lead/i }))

  await waitFor(() =>
    expect(adminUpdateLead).toHaveBeenCalledWith('l-1', expect.objectContaining({ name: 'Carlos', notes: 'Já visitou a loja' })),
  )
  expect(onClose).toHaveBeenCalled()
  expect(adminCreateManualLead).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/LeadQuickAddModal.test.tsx`
Expected: FAIL — no "Observações" field exists, `lead` prop is not accepted, `adminUpdateLead` is never called.

- [ ] **Step 3: Write the implementation**

Replace the whole file with:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { adminCreateManualLead, adminUpdateLead } from '@/app/actions/leads'
import type { Lead, LeadStage } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { VehicleDatePicker } from './VehicleDatePicker'

interface LeadQuickAddModalProps {
  vehicles: VehicleOption[]
  onClose: () => void
  lead?: Lead
  defaultVehicleId?: string
  defaultStage?: LeadStage
  title?: string
}

const STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: 'novo', label: 'Lead novo' },
  { value: 'visita_marcada', label: 'Visita marcada' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'ligar_de_volta', label: 'Ligar de volta' },
  { value: 'vendeu', label: 'Vendeu' },
  { value: 'nao_comprou', label: 'Não comprou' },
]

const inputClass =
  'h-11 rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const textareaClass =
  'rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const labelClass = 'text-sm font-bold'
const sectionLabelClass = 'text-xs font-bold uppercase tracking-wide text-support-gray'
const primaryButtonClass =
  'flex-1 rounded-lg bg-aguiar-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass =
  'flex-1 rounded-lg border border-support-gray/25 px-5 py-3 text-sm font-bold text-graphite transition-colors hover:border-graphite'

export function LeadQuickAddModal({
  vehicles, onClose, lead, defaultVehicleId = '', defaultStage = 'novo', title,
}: LeadQuickAddModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [firstContactAt, setFirstContactAt] = useState(lead?.first_contact_at ?? '')
  const [storeVisitAt, setStoreVisitAt] = useState(lead?.store_visit_at ?? '')
  const [scheduledVisitDate, setScheduledVisitDate] = useState(lead?.scheduled_visit_date ?? '')

  const modalTitle = title ?? (lead ? 'Editar lead' : 'Novo lead')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    const input = {
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      vehicleId: String(formData.get('vehicleId') || '') || undefined,
      stage: (String(formData.get('stage') || '') || undefined) as LeadStage | undefined,
      notes: String(formData.get('notes') || '') || undefined,
      firstContactAt: firstContactAt || undefined,
      storeVisitAt: storeVisitAt || undefined,
      scheduledVisitDate: scheduledVisitDate || undefined,
      scheduledVisitTime: String(formData.get('scheduledVisitTime') || '') || undefined,
    }

    setSaving(true)
    try {
      if (lead) {
        await adminUpdateLead(lead.id, input)
      } else {
        await adminCreateManualLead(input)
      }
      router.refresh()
      onClose()
    } catch {
      setError('Não foi possível salvar o lead. Confira os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 p-4" role="dialog" aria-modal="true" aria-label={modalTitle}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-support-gray hover:text-graphite">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className={sectionLabelClass}>Contato</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-name" className={labelClass}>Nome</label>
                <input id="lead-name" name="name" autoComplete="name" placeholder="Ex.: Maria Silva" defaultValue={lead?.name} required className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-phone" className={labelClass}>Telefone</label>
                <input id="lead-phone" name="phone" type="tel" autoComplete="tel" placeholder="(98) 99999-9999" defaultValue={lead?.phone} required className={inputClass} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-support-gray/15 pt-5">
            <p className={sectionLabelClass}>Veículo e funil</p>
            <div className="flex flex-col gap-1">
              <label htmlFor="lead-vehicle" className={labelClass}>Veículo de interesse (opcional)</label>
              <select id="lead-vehicle" name="vehicleId" defaultValue={lead?.vehicle_id ?? defaultVehicleId} className={inputClass}>
                <option value="">Sem veículo vinculado</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} {vehicle.version ?? ''} - {formatPriceFromCents(vehicle.price_cents)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="lead-stage" className={labelClass}>Estágio no funil</label>
              <select id="lead-stage" name="stage" defaultValue={lead?.stage ?? defaultStage} className={inputClass}>
                {STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-support-gray/15 pt-5">
            <p className={sectionLabelClass}>Datas (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-first-contact" className={labelClass}>Primeiro contato</label>
                <VehicleDatePicker id="lead-first-contact" value={firstContactAt} onChange={setFirstContactAt} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-store-visit" className={labelClass}>Veio na loja</label>
                <VehicleDatePicker id="lead-store-visit" value={storeVisitAt} onChange={setStoreVisitAt} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-scheduled-date" className={labelClass}>Visita marcada</label>
                <VehicleDatePicker id="lead-scheduled-date" value={scheduledVisitDate} onChange={setScheduledVisitDate} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-scheduled-time" className={labelClass}>Hora da visita</label>
                <input id="lead-scheduled-time" name="scheduledVisitTime" type="time" defaultValue={lead?.scheduled_visit_time ?? ''} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-support-gray/15 pt-5">
            <label htmlFor="lead-notes" className={labelClass}>Observações</label>
            <textarea
              id="lead-notes"
              name="notes"
              rows={3}
              defaultValue={lead?.notes ?? ''}
              placeholder="Anotações sobre o cliente ou a negociação"
              className={textareaClass}
            />
          </div>

          {error && <p className="text-sm text-aguiar-red">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Salvando...' : 'Salvar lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/LeadQuickAddModal.test.tsx`
Expected: PASS. The pre-existing exact-match test (`'defaults to the "novo" stage and omits optional dates when left blank'`) still passes unmodified — Vitest's `toHaveBeenCalledWith` uses `toEqual` semantics, which ignores an extra key whose value is `undefined`, and an empty textarea submits `notes: undefined`.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `cd site && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/LeadQuickAddModal.tsx tests/components/admin/LeadQuickAddModal.test.tsx
git commit -m "feat(leads): add edit mode and Observações field to LeadQuickAddModal"
```

---

### Task 10: `LeadCard.tsx`

**Files:**
- Create: `site/src/components/admin/LeadCard.tsx`
- Test: `site/tests/components/admin/LeadCard.test.tsx`

**Interfaces:**
- Consumes: `Lead`, `LeadStage` from `@/lib/types`; `VehicleOption` from `@/lib/queries/vehicles`; `LEAD_STAGES`, `LEAD_STAGE_LABELS`, `buildWhatsAppLink`, `formatIsoDate` from `@/lib/lead-kanban` (Task 3); `formatPriceFromCents` from `@/lib/format`; `adminDeleteLead` from `@/app/actions/leads` (Task 6); `LeadQuickAddModal` (Task 9); `useDraggable` from `@dnd-kit/core`, `CSS` from `@dnd-kit/utilities` (Task 8).
- Produces: `LeadCard({ lead, vehicles, onMoveToStage }): JSX.Element` — a draggable card (drag id = `lead.id`) with a "..." menu offering every other stage plus "Excluir", a WhatsApp link, and an "Editar" button.

- [ ] **Step 1: Write the failing tests**

```tsx
// site/tests/components/admin/LeadCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminDeleteLead, adminCreateManualLead, adminUpdateLead } = vi.hoisted(() => ({
  adminDeleteLead: vi.fn(), adminCreateManualLead: vi.fn(), adminUpdateLead: vi.fn(),
}))
vi.mock('@/app/actions/leads', () => ({ adminDeleteLead, adminCreateManualLead, adminUpdateLead }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { DndContext } from '@dnd-kit/core'
import { LeadCard } from '@/components/admin/LeadCard'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '(98) 99999-9999', details: null,
    vehicle_id: 'v-1', stage: 'novo', first_contact_at: '2026-09-01', store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: 'Quer trocar o carro',
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

const VEHICLES = [{ id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', status: 'available' as const, price_cents: 6490000 }]

function renderCard(lead: Lead, onMoveToStage = vi.fn()) {
  return render(
    <DndContext onDragEnd={() => {}}>
      <LeadCard lead={lead} vehicles={VEHICLES} onMoveToStage={onMoveToStage} />
    </DndContext>,
  )
}

describe('LeadCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows name, phone, linked vehicle, notes, and dates', () => {
    renderCard(makeLead())
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('(98) 99999-9999')).toBeInTheDocument()
    expect(screen.getByText(/Fiat Argo Drive/)).toBeInTheDocument()
    expect(screen.getByText('Quer trocar o carro')).toBeInTheDocument()
    expect(screen.getByText(/Primeiro contato: 01\/09\/2026/)).toBeInTheDocument()
  })

  it('links the WhatsApp button to the lead\'s number', () => {
    renderCard(makeLead())
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', 'https://wa.me/5598999999999')
  })

  it('calls onMoveToStage with the chosen stage from the "..." menu', () => {
    const onMoveToStage = vi.fn()
    renderCard(makeLead({ stage: 'novo' }), onMoveToStage)
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Negociando' }))
    expect(onMoveToStage).toHaveBeenCalledWith('negociando')
  })

  it('does not offer moving to the lead\'s current stage', () => {
    renderCard(makeLead({ stage: 'novo' }))
    fireEvent.click(screen.getByLabelText('Mais opções'))
    expect(screen.queryByRole('button', { name: 'Lead novo' })).not.toBeInTheDocument()
  })

  it('deletes the lead after confirming', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderCard(makeLead({ id: 'l-9' }))
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(adminDeleteLead).toHaveBeenCalledWith('l-9')
  })

  it('does not delete when the confirmation is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderCard(makeLead())
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(adminDeleteLead).not.toHaveBeenCalled()
  })

  it('opens the edit modal pre-filled when "Editar" is clicked', () => {
    renderCard(makeLead({ name: 'Maria' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByText('Editar lead')).toBeInTheDocument()
    expect(screen.getByLabelText(/^nome$/i)).toHaveValue('Maria')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/LeadCard.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/LeadCard'`.

- [ ] **Step 3: Write the implementation**

```tsx
// site/src/components/admin/LeadCard.tsx
'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Lead, LeadStage } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { LEAD_STAGES, LEAD_STAGE_LABELS, buildWhatsAppLink, formatIsoDate } from '@/lib/lead-kanban'
import { formatPriceFromCents } from '@/lib/format'
import { adminDeleteLead } from '@/app/actions/leads'
import { LeadQuickAddModal } from './LeadQuickAddModal'

interface LeadCardProps {
  lead: Lead
  vehicles: VehicleOption[]
  onMoveToStage: (stage: LeadStage) => void
}

export function LeadCard({ lead, vehicles, onMoveToStage }: LeadCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  // The whole card is the drag handle — dnd-kit's PointerSensor (configured
  // with an activation distance in LeadKanbanBoard) only starts a drag after
  // the pointer moves past a threshold, so a plain click on a button inside
  // the card still fires normally.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })

  const vehicle = vehicles.find((option) => option.id === lead.vehicle_id)
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{lead.name}</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Mais opções"
            className="rounded p-1 text-support-gray hover:bg-support-gray/10 hover:text-graphite"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-support-gray/25 bg-white p-1 shadow-lg">
              <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-support-gray">Mover para</p>
              {LEAD_STAGES.filter((stage) => stage !== lead.stage).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => { setMenuOpen(false); onMoveToStage(stage) }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm text-graphite hover:bg-support-gray/10"
                >
                  {LEAD_STAGE_LABELS[stage]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); if (window.confirm('Excluir este lead?')) adminDeleteLead(lead.id) }}
                className="mt-1 block w-full rounded border-t border-support-gray/15 px-2 py-1.5 text-left text-sm text-aguiar-red hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-support-gray">{lead.phone}</p>

      {vehicle && (
        <p className="text-sm text-graphite">
          {vehicle.brand} {vehicle.model} {vehicle.version ?? ''} · {formatPriceFromCents(vehicle.price_cents)}
        </p>
      )}

      {lead.notes && <p className="text-sm text-support-gray">{lead.notes}</p>}

      {(lead.first_contact_at || lead.store_visit_at || lead.scheduled_visit_date) && (
        <div className="flex flex-col gap-0.5 text-xs text-support-gray">
          {lead.first_contact_at && <span>Primeiro contato: {formatIsoDate(lead.first_contact_at)}</span>}
          {lead.store_visit_at && <span>Veio na loja: {formatIsoDate(lead.store_visit_at)}</span>}
          {lead.scheduled_visit_date && (
            <span>
              Visita marcada: {formatIsoDate(lead.scheduled_visit_date)}
              {lead.scheduled_visit_time ? ` às ${lead.scheduled_visit_time.slice(0, 5)}` : ''}
            </span>
          )}
        </div>
      )}

      <div className="mt-1 flex gap-2 border-t border-support-gray/15 pt-2">
        <a
          href={buildWhatsAppLink(lead.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-lg border border-support-gray/25 px-3 py-1.5 text-center text-xs font-bold text-graphite hover:border-graphite"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="flex-1 rounded-lg border border-support-gray/25 px-3 py-1.5 text-center text-xs font-bold text-graphite hover:border-graphite"
        >
          Editar
        </button>
      </div>

      {showEditModal && (
        <LeadQuickAddModal
          vehicles={vehicles}
          lead={lead}
          title="Editar lead"
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/LeadCard.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/LeadCard.tsx tests/components/admin/LeadCard.test.tsx
git commit -m "feat(leads): add LeadCard with move/edit/delete/WhatsApp actions"
```

---

### Task 11: `LeadKanbanBoard.tsx`

**Files:**
- Create: `site/src/components/admin/LeadKanbanBoard.tsx`
- Test: `site/tests/components/admin/LeadKanbanBoard.test.tsx`

**Interfaces:**
- Consumes: `Lead`, `LeadStage` from `@/lib/types`; `VehicleOption` from `@/lib/queries/vehicles`; `LEAD_STAGES`, `LEAD_STAGE_LABELS`, `groupLeadsByStage`, `requiresSaleCompletion` from `@/lib/lead-kanban` (Task 3); `adminUpdateLeadStage` from `@/app/actions/leads` (Task 6); `LeadCard` (Task 10); `VehicleSaleForm` (Task 7); `DndContext`, `useDroppable`, `PointerSensor`, `useSensor`, `useSensors`, `type DragEndEvent` from `@dnd-kit/core`.
- Produces: `LeadKanbanBoard({ leads, vehicles }): JSX.Element` — the full board, wired for both drag-and-drop and the per-card menu, including the "move to Vendeu" sale-completion flow.

- [ ] **Step 1: Write the failing tests**

```tsx
// site/tests/components/admin/LeadKanbanBoard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

import { LeadKanbanBoard } from '@/components/admin/LeadKanbanBoard'
import type { Lead } from '@/lib/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l-1', type: 'manual', name: 'Maria', phone: '98999999999', details: null,
    vehicle_id: null, stage: 'novo', first_contact_at: null, store_visit_at: null,
    scheduled_visit_date: null, scheduled_visit_time: null, notes: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

const VEHICLES = [{ id: 'v-1', brand: 'Fiat', model: 'Argo', version: 'Drive', status: 'available' as const, price_cents: 6490000 }]

describe('LeadKanbanBoard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a column per stage with the right lead counts', () => {
    const leads = [makeLead({ id: 'a', stage: 'novo' }), makeLead({ id: 'b', stage: 'negociando', name: 'Ana' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)
    expect(screen.getByText('Lead novo')).toBeInTheDocument()
    expect(screen.getByText('Negociando')).toBeInTheDocument()
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('moves a lead without a vehicle straight to the target stage via the card menu', async () => {
    const leads = [makeLead({ id: 'a', stage: 'novo', vehicle_id: null })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Negociando' }))

    await waitFor(() => expect(adminUpdateLeadStage).toHaveBeenCalledWith('a', 'negociando'))
  })

  it('opens the vehicle sale form instead of moving directly when a lead with a vehicle is moved to "Vendeu"', () => {
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Vendeu' }))

    expect(adminUpdateLeadStage).not.toHaveBeenCalled()
    expect(screen.getByText('Registrar venda')).toBeInTheDocument()
  })

  it('moves the lead to "Vendeu" only after the sale form is saved', async () => {
    adminMarkVehicleSold.mockResolvedValue(undefined)
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Vendeu' }))

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    fireEvent.change(screen.getByLabelText(/data da venda/i), { target: { value: '2026-09-02' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    await waitFor(() => expect(adminMarkVehicleSold).toHaveBeenCalledWith('v-1', {
      salePriceCents: 6200000, soldAt: '2026-09-02', buyerLeadId: 'a',
    }))
    expect(adminUpdateLeadStage).toHaveBeenCalledWith('a', 'vendeu')
  })

  it('keeps the lead in its current stage when the sale form is cancelled', () => {
    const leads = [makeLead({ id: 'a', stage: 'negociando', vehicle_id: 'v-1' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Vendeu' }))
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(adminUpdateLeadStage).not.toHaveBeenCalled()
    expect(screen.queryByText('Registrar venda')).not.toBeInTheDocument()
  })

  it('deletes a lead after confirmation from the card menu', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const leads = [makeLead({ id: 'a' })]
    render(<LeadKanbanBoard leads={leads} vehicles={VEHICLES} />)

    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(adminDeleteLead).toHaveBeenCalledWith('a')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/components/admin/LeadKanbanBoard.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/LeadKanbanBoard'`.

- [ ] **Step 3: Write the implementation**

```tsx
// site/src/components/admin/LeadKanbanBoard.tsx
'use client'

import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import type { Lead, LeadStage } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { LEAD_STAGES, LEAD_STAGE_LABELS, groupLeadsByStage, requiresSaleCompletion } from '@/lib/lead-kanban'
import { adminUpdateLeadStage } from '@/app/actions/leads'
import { LeadCard } from './LeadCard'
import { VehicleSaleForm } from './VehicleSaleForm'

interface LeadKanbanBoardProps {
  leads: Lead[]
  vehicles: VehicleOption[]
}

interface LeadKanbanColumnProps {
  stage: LeadStage
  leads: Lead[]
  vehicles: VehicleOption[]
  onMoveToStage: (lead: Lead, stage: LeadStage) => void
}

function LeadKanbanColumn({ stage, leads, vehicles, onMoveToStage }: LeadKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-3 rounded-xl p-3 ${isOver ? 'bg-card-gray' : 'bg-card-gray/50'}`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-graphite">{LEAD_STAGE_LABELS[stage]}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-support-gray">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} vehicles={vehicles} onMoveToStage={(target) => onMoveToStage(lead, target)} />
        ))}
      </div>
    </div>
  )
}

export function LeadKanbanBoard({ leads, vehicles }: LeadKanbanBoardProps) {
  const [saleFormLead, setSaleFormLead] = useState<Lead | null>(null)
  // A small activation distance lets a plain click on a card's buttons pass
  // through as a click instead of being swallowed as a (zero-distance) drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const groups = groupLeadsByStage(leads)

  function handleStageChange(lead: Lead, stage: LeadStage) {
    if (stage === lead.stage) return
    if (requiresSaleCompletion(lead, stage)) {
      setSaleFormLead(lead)
      return
    }
    adminUpdateLeadStage(lead.id, stage)
  }

  function handleDragEnd(event: DragEndEvent) {
    const targetId = event.over?.id
    if (typeof targetId !== 'string' || !LEAD_STAGES.includes(targetId as LeadStage)) return
    const lead = leads.find((candidate) => candidate.id === event.active.id)
    if (lead) handleStageChange(lead, targetId as LeadStage)
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => (
            <LeadKanbanColumn
              key={stage}
              stage={stage}
              leads={groups[stage]}
              vehicles={vehicles}
              onMoveToStage={handleStageChange}
            />
          ))}
        </div>
      </DndContext>

      {saleFormLead && saleFormLead.vehicle_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-lg font-bold">Registrar venda</h2>
            <VehicleSaleForm
              vehicleId={saleFormLead.vehicle_id}
              leads={leads}
              defaultBuyerLeadId={saleFormLead.id}
              onCancel={() => setSaleFormLead(null)}
              onSaved={() => {
                adminUpdateLeadStage(saleFormLead.id, 'vendeu')
                setSaleFormLead(null)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `cd site && npx vitest run tests/components/admin/LeadKanbanBoard.test.tsx`
Expected: PASS (6 tests). Note: these tests exercise the "..." menu path, not a simulated pointer drag gesture — `handleDragEnd` calls the exact same `handleStageChange` function the menu calls, and simulating real drag/pointer sequences through jsdom is fragile/not how dnd-kit consumers are typically tested, so the menu path gives full coverage of the business logic while the actual `DndContext` wiring stays thin glue.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/LeadKanbanBoard.tsx tests/components/admin/LeadKanbanBoard.test.tsx
git commit -m "feat(leads): add LeadKanbanBoard with drag-and-drop and sale-completion flow"
```

---

### Task 12: Wire the board into `/admin/leads`; retire `LeadTable`

**Files:**
- Modify: `site/src/app/admin/(dashboard)/leads/page.tsx`
- Delete: `site/src/components/admin/LeadTable.tsx`
- Delete: `site/tests/components/admin/LeadTable.test.tsx`

**Interfaces:**
- Consumes: `getAllLeadsAdmin` from `@/lib/queries/leads` (unchanged); `getVehicleOptionsAdmin` from `@/lib/queries/vehicles` (unchanged, already used in `AdminLayout`); `LeadKanbanBoard` (Task 11).

- [ ] **Step 1: Replace the page**

Replace the full contents of `site/src/app/admin/(dashboard)/leads/page.tsx`:

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getVehicleOptionsAdmin } from '@/lib/queries/vehicles'
import { LeadKanbanBoard } from '@/components/admin/LeadKanbanBoard'

export default async function AdminLeadsPage() {
  const client = await createServerSupabaseClient()
  const [leads, vehicles] = await Promise.all([getAllLeadsAdmin(client), getVehicleOptionsAdmin(client)])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Leads</h1>
      {leads.length === 0 ? (
        <p className="text-support-gray">Nenhum lead recebido ainda.</p>
      ) : (
        <LeadKanbanBoard leads={leads} vehicles={vehicles} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Delete the retired table component and its test**

```bash
git rm src/components/admin/LeadTable.tsx tests/components/admin/LeadTable.test.tsx
```

- [ ] **Step 3: Confirm nothing else references `LeadTable`**

Run: `cd site && grep -rn "LeadTable" src tests`
Expected: no matches.

- [ ] **Step 4: Verify the project still typechecks**

Run: `cd site && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\(dashboard\)/leads/page.tsx
git commit -m "feat(leads): wire LeadKanbanBoard into /admin/leads, retire LeadTable"
```

---

### Task 13: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd site && npm test`
Expected: PASS — every test file in the project, old and new, green.

- [ ] **Step 2: Typecheck the whole project**

Run: `cd site && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `cd site && npm run lint`
Expected: PASS (no new warnings/errors introduced by this plan's files).

- [ ] **Step 4: Manual smoke test**

Run: `cd site && npm run dev`, open `/admin/leads` in a browser logged in as admin. Confirm: 6 columns render with correct counts; dragging a card to another column moves it; the "..." menu's "Mover para" does the same; "Editar" opens the pre-filled modal and saves; "Excluir" asks for confirmation and removes the card; the WhatsApp button opens `wa.me` in a new tab; moving a vehicle-linked lead to "Vendeu" opens the sale form, and confirming it both marks the vehicle sold (check `/admin/veiculos`) and moves the card to "Vendeu"; cancelling that form leaves the card in place.

No commit for this task — it's a verification pass over Tasks 1–12's work, already committed.

---

## After all tasks

This closes sub-projeto 2/6 (Leads/CRM). Per the approved build order in
`docs/superpowers/specs/2026-09-01-sistema-estoque-design.md`, sub-projeto 3
is Painel (which aggregates Estoque + Leads + Metas) — its own
brainstorming → spec → plan cycle when the user is ready to start it.
