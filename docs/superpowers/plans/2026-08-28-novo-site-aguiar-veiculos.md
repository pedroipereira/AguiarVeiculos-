# Novo Site Aguiar Veículos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship the new aguiarveiculos.com site — public catalog + institutional home page, admin CMS, and ApiPlacas lookup — on Next.js + Supabase + Vercel.

**Architecture:** Next.js (App Router, TypeScript) app in `site/`, reading/writing a Supabase Postgres database through a small dependency-injected query/action layer so logic is unit-testable without a live remote project. Local development and automated tests run against the Supabase CLI's local stack (Docker), which satisfies the spec's "manually created dev Supabase project" fallback while the real MCP connector authorization is pending. Public pages read through a `vehicles_public` Postgres view that omits `plate`, enforced by RLS as well as by code convention — the plate can't leak even if a page is coded wrong.

**Tech Stack:** Next.js 15.1.0 (App Router), React 19, TypeScript 5.6, Tailwind CSS 3.4, @supabase/supabase-js 2.45.4, @supabase/ssr 0.5.1, zod 3.23.8, Vitest 2.1.1 + Testing Library, Supabase CLI (local dev stack), Vercel (hosting).

**Spec:** `docs/superpowers/specs/2026-08-28-novo-site-aguiar-veiculos-design.md`

## Global Constraints

- Idioma de todo o texto do site: português (do `marketing/voz-e-tom.md`).
- Cores oficiais (Tailwind tokens): Graphite `#111111`, Aguiar Red `#D32027`, Card Gray `#F4F4F4`, Support Gray `#6E6E6E`, Branco `#FFFFFF` — de `identidade/marca.md`.
- `vehicles.plate` nunca é retornado nem renderizado em nenhuma página ou resposta pública — leituras públicas usam sempre a view `vehicles_public` (sem a coluna `plate`), nunca a tabela `vehicles` diretamente. Reforçado por RLS, não só por convenção de código.
- Nenhum texto, imagem ou código do site da Belloni Motors é reaproveitado literalmente — só a sequência de seções serve de inspiração.
- Fora de escopo (não implementar): checkout/pagamento online, múltiplos usuários/permissões no admin, integração com CRM/banco, blog, multilíngue.
- Segredos (`APIPLACAS_API_KEY`, chaves de serviço do Supabase) só via variável de ambiente (`.env.local`, nunca commitado — já coberto por `.gitignore`) — nunca hardcoded ou colado em texto puro.
- WhatsApp da loja: `(98) 99103-0107` → `5598991030107` em formato internacional para links `wa.me`.
- Endereço da loja: BR-135, Campo Dantas, Presidente Dutra - MA.

---

## File Structure

```
site/
├── package.json, tsconfig.json, next.config.ts, tailwind.config.ts,
│   postcss.config.js, vitest.config.ts, .env.local.example
├── tests/
│   └── setup.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/0001_init.sql
│   └── seed.sql
└── src/
    ├── middleware.ts                      # protects /admin/*
    ├── lib/
    │   ├── types.ts                       # DB row types
    │   ├── format.ts                      # price, slug helpers
    │   ├── whatsapp.ts                     # wa.me link builders
    │   ├── validation.ts                   # zod schemas
    │   ├── apiplacas.ts                    # server-only plate lookup adapter
    │   ├── supabase/
    │   │   ├── browser.ts
    │   │   └── server.ts
    │   ├── queries/
    │   │   ├── vehicles.ts
    │   │   ├── testimonials.ts
    │   │   └── site-settings.ts
    │   └── actions/
    │       ├── leads.ts
    │       ├── vehicles.ts
    │       ├── testimonials.ts
    │       └── site-settings.ts
    ├── components/
    │   ├── ui/ (Button, Card, Section, WhatsAppButton)
    │   ├── layout/ (Header, Footer)
    │   ├── home/ (one file per home section + HomeView)
    │   └── admin/ (VehicleForm, VehicleTable, TestimonialForm, ...)
    └── app/
        ├── layout.tsx, globals.css, page.tsx
        ├── estoque/page.tsx, estoque/[slug]/page.tsx
        ├── api/admin/placas/route.ts
        └── admin/
            ├── login/page.tsx
            ├── layout.tsx, page.tsx
            ├── veiculos/page.tsx, veiculos/novo/page.tsx, veiculos/[id]/page.tsx
            ├── depoimentos/page.tsx
            ├── leads/page.tsx
            └── configuracoes/page.tsx
```

---

### Task 1: Project scaffold (Next.js + TypeScript + Tailwind + Vitest)

**Files:**
- Create: `site/package.json`, `site/tsconfig.json`, `site/next.config.ts`, `site/tailwind.config.ts`, `site/postcss.config.js`, `site/vitest.config.ts`, `site/tests/setup.ts`
- Create: `site/src/app/layout.tsx`, `site/src/app/globals.css`, `site/src/app/page.tsx`
- Test: `site/tests/app/page.test.tsx`

**Interfaces:**
- Produces: Tailwind tokens `graphite`, `aguiar-red`, `card-gray`, `support-gray` usable as `bg-graphite`, `text-aguiar-red`, etc. in every later component. Path alias `@/*` → `site/src/*`.

- [ ] **Step 1: Create `site/package.json`**

```json
{
  "name": "aguiar-veiculos-site",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@supabase/supabase-js": "2.45.4",
    "@supabase/ssr": "0.5.1",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "@types/node": "22.7.4",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.2",
    "tailwindcss": "3.4.13",
    "postcss": "8.4.47",
    "autoprefixer": "10.4.20",
    "vitest": "2.1.1",
    "@vitejs/plugin-react": "4.3.1",
    "@testing-library/react": "16.0.1",
    "@testing-library/jest-dom": "6.5.0",
    "jsdom": "25.0.0"
  }
}
```

- [ ] **Step 2: Create config files**

`site/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`site/next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
}

export default nextConfig
```

`site/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#111111',
        'aguiar-red': '#D32027',
        'card-gray': '#F4F4F4',
        'support-gray': '#6E6E6E',
      },
    },
  },
  plugins: [],
}

export default config
```

`site/postcss.config.js`:
```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

`site/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

`site/tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Install dependencies**

Run: `cd site && npm install`
Expected: installs cleanly, `node_modules/` created (already covered by root `.gitignore`).

- [ ] **Step 4: Write the failing smoke test**

`site/tests/app/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home page', () => {
  it('renders the Aguiar Veículos headline', async () => {
    render(await Home())
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/aguiar veículos/i)
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd site && npx vitest run tests/app/page.test.tsx`
Expected: FAIL — `@/app/page` does not exist yet.

- [ ] **Step 6: Implement minimal layout, globals, and page**

`site/src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-graphite text-white;
}
```

`site/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aguiar Veículos — Novos e Seminovos em Presidente Dutra - MA',
  description:
    'Aguiar Veículos: mais de 15 anos vendendo carros novos e seminovos com procedência em Presidente Dutra - MA. Financiamento facilitado e troca do seu usado.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

`site/src/app/page.tsx` (expanded further in Task 17 — placeholder heading for now):
```tsx
export default async function Home() {
  return (
    <main>
      <h1 className="text-4xl font-bold uppercase">Aguiar Veículos</h1>
    </main>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd site && npx vitest run tests/app/page.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/package.json site/tsconfig.json site/next.config.ts site/tailwind.config.ts site/postcss.config.js site/vitest.config.ts site/tests/setup.ts site/tests/app/page.test.tsx site/src/app/layout.tsx site/src/app/globals.css site/src/app/page.tsx site/package-lock.json
git commit -m "feat(site): scaffold Next.js + Tailwind + Vitest project"
```

---

### Task 2: Supabase schema, RLS, and local dev stack

**Files:**
- Create: `site/supabase/config.toml`, `site/supabase/migrations/0001_init.sql`, `site/supabase/seed.sql`
- Create: `site/.env.local.example`

**Interfaces:**
- Produces: tables `vehicles`, `vehicle_images`, `leads`, `testimonials`, `site_settings`; public-safe views `vehicles_public` (no `plate` column), `testimonials_published` (only `is_published = true`). Every later query/action task reads/writes these exact names.

- [ ] **Step 1: Initialize the Supabase CLI project**

Run: `cd site && npx supabase@1.207.9 init`
Expected: creates `supabase/config.toml` and `supabase/` skeleton (accept the generated `config.toml`, or replace with the one below if the CLI version differs).

- [ ] **Step 2: Write the schema migration**

`site/supabase/migrations/0001_init.sql`:
```sql
create extension if not exists "uuid-ossp";

create type vehicle_status as enum ('available', 'sold');
create type lead_type as enum ('financing', 'trade_in');

create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  brand text not null,
  model text not null,
  version text,
  year_model integer not null,
  year_fabrication integer not null,
  mileage_km integer not null default 0,
  price_cents integer not null,
  fuel_type text,
  transmission text,
  color text,
  description text,
  is_featured boolean not null default false,
  status vehicle_status not null default 'available',
  plate text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vehicle_images (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  storage_path text not null,
  display_order integer not null default 0
);

create table leads (
  id uuid primary key default uuid_generate_v4(),
  type lead_type not null,
  name text not null,
  phone text not null,
  details jsonb,
  vehicle_id uuid references vehicles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table testimonials (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  caption text not null,
  display_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table site_settings (
  key text primary key,
  value text
);

insert into site_settings (key, value) values ('location_video_url', null);

-- Public-safe views: never expose `plate`, never expose unpublished testimonials.
create view vehicles_public as
  select id, slug, brand, model, version, year_model, year_fabrication, mileage_km,
         price_cents, fuel_type, transmission, color, description, is_featured,
         status, created_at, updated_at
  from vehicles;

create view testimonials_published as
  select id, image_url, caption, display_order, created_at
  from testimonials
  where is_published = true;

-- Row Level Security
alter table vehicles enable row level security;
alter table vehicle_images enable row level security;
alter table leads enable row level security;
alter table testimonials enable row level security;
alter table site_settings enable row level security;

-- Base tables: only authenticated (admin) sessions may touch them directly.
-- Public code must read through the *_public views instead (granted below).
create policy "admin full access to vehicles" on vehicles
  for all to authenticated using (true) with check (true);
create policy "admin full access to vehicle_images" on vehicle_images
  for all to authenticated using (true) with check (true);
create policy "admin read access to leads" on leads
  for select to authenticated using (true);
create policy "anyone can insert a lead" on leads
  for insert to anon, authenticated with check (true);
create policy "admin full access to testimonials" on testimonials
  for all to authenticated using (true) with check (true);
create policy "admin full access to site_settings" on site_settings
  for all to authenticated using (true) with check (true);
create policy "anyone can read site_settings" on site_settings
  for select to anon, authenticated using (true);
create policy "anyone can read vehicle_images" on vehicle_images
  for select to anon, authenticated using (true);

grant select on vehicles_public to anon, authenticated;
grant select on testimonials_published to anon, authenticated;

-- Storage buckets for vehicle and testimonial photos.
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true), ('testimonial-images', 'testimonial-images', true)
on conflict (id) do nothing;

create policy "public can read vehicle-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'vehicle-images');
create policy "admin can write vehicle-images" on storage.objects
  for all to authenticated using (bucket_id = 'vehicle-images') with check (bucket_id = 'vehicle-images');
create policy "public can read testimonial-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'testimonial-images');
create policy "admin can write testimonial-images" on storage.objects
  for all to authenticated using (bucket_id = 'testimonial-images') with check (bucket_id = 'testimonial-images');
```

- [ ] **Step 3: Write seed data for local dev**

`site/supabase/seed.sql`:
```sql
insert into vehicles (slug, brand, model, version, year_model, year_fabrication, mileage_km, price_cents, fuel_type, transmission, color, description, is_featured, status, plate)
values
  ('vw-polo-2026', 'Volkswagen', 'Polo', 'Comfortline 200 TSI', 2026, 2025, 8000, 8990000, 'Flex', 'Automático', 'Branco', 'Praticamente zero km, único dono, revisado.', true, 'available', 'ABC1D23'),
  ('fiat-argo-2023', 'Fiat', 'Argo', 'Drive 1.0', 2023, 2023, 32000, 6490000, 'Flex', 'Manual', 'Prata', 'Carro de família, procedência garantida.', true, 'available', 'DEF4G56'),
  ('hyundai-hb20-2022', 'Hyundai', 'HB20', 'Comfort 1.0', 2022, 2022, 41000, 6190000, 'Flex', 'Manual', 'Vermelho', 'Revisado e higienizado, com garantia.', false, 'available', 'GHI7J89');

insert into testimonials (image_url, caption, display_order, is_published)
values ('https://placehold.co/600x600', 'Mais uma venda realizada na Aguiar Veículos! 🙏❤️', 1, true);
```

- [ ] **Step 4: Create the env var template**

`site/.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APIPLACAS_API_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=5598991030107
```

- [ ] **Step 5: Start the local stack and apply the migration**

Run: `cd site && npx supabase start` (requires Docker running), then `npx supabase db reset`
Expected: local Postgres/Auth/Storage containers start; `db reset` applies `0001_init.sql` then `seed.sql` with no errors. The command prints local `API URL`, `anon key`, and `service_role key` — copy them into a real `site/.env.local` (not committed).

- [ ] **Step 6: Verify the schema and the plate-safety guarantee**

Run:
```bash
cd site && npx supabase db psql -c "select slug, brand, model from vehicles_public order by slug;" \
  && npx supabase db psql -c "select column_name from information_schema.columns where table_name = 'vehicles_public';"
```
Expected: first query lists the 3 seeded vehicles; second query's column list does NOT include `plate`.

- [ ] **Step 7: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/supabase site/.env.local.example
git commit -m "feat(site): add Supabase schema, RLS policies, and local dev seed"
```

---

### Task 3: Domain types and Supabase client wrappers

**Files:**
- Create: `site/src/lib/types.ts`, `site/src/lib/supabase/browser.ts`, `site/src/lib/supabase/server.ts`
- Test: `site/tests/lib/supabase.test.ts`

**Interfaces:**
- Consumes: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Task 2).
- Produces: `createBrowserSupabaseClient(): SupabaseClient`; `createServerSupabaseClient(): Promise<SupabaseClient>`; types `VehicleStatus`, `VehiclePublic`, `Vehicle`, `VehicleImage`, `Testimonial`, `LeadType`, `Lead` — used by every query/action/component task below.

- [ ] **Step 1: Write the failing test**

`site/tests/lib/supabase.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ browser: true })),
  createServerClient: vi.fn(() => ({ server: true })),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}))

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
})

describe('supabase clients', () => {
  it('creates a browser client using env vars', async () => {
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/browser')
    const client = createBrowserSupabaseClient()
    expect(client).toEqual({ browser: true })
  })

  it('creates a server client using env vars and cookies', async () => {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const client = await createServerSupabaseClient()
    expect(client).toEqual({ server: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/supabase.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement types and clients**

`site/src/lib/types.ts`:
```ts
export type VehicleStatus = 'available' | 'sold'

export interface VehiclePublic {
  id: string
  slug: string
  brand: string
  model: string
  version: string | null
  year_model: number
  year_fabrication: number
  mileage_km: number
  price_cents: number
  fuel_type: string | null
  transmission: string | null
  color: string | null
  description: string | null
  is_featured: boolean
  status: VehicleStatus
  created_at: string
  updated_at: string
}

export interface Vehicle extends VehiclePublic {
  plate: string | null
}

export interface VehicleImage {
  id: string
  vehicle_id: string
  storage_path: string
  display_order: number
}

export interface Testimonial {
  id: string
  image_url: string
  caption: string
  display_order: number
  is_published: boolean
  created_at: string
}

export type LeadType = 'financing' | 'trade_in'

export interface Lead {
  id: string
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown> | null
  vehicle_id: string | null
  created_at: string
}
```

`site/src/lib/supabase/browser.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

`site/src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/supabase.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/types.ts site/src/lib/supabase site/tests/lib/supabase.test.ts
git commit -m "feat(site): add domain types and Supabase client wrappers"
```

---

### Task 4: Formatting and WhatsApp link utilities

**Files:**
- Create: `site/src/lib/format.ts`, `site/src/lib/whatsapp.ts`
- Test: `site/tests/lib/format.test.ts`, `site/tests/lib/whatsapp.test.ts`

**Interfaces:**
- Produces: `formatPriceFromCents(cents: number): string`, `buildVehicleSlug(brand: string, model: string, yearModel: number, idFragment: string): string`, `WHATSAPP_NUMBER`, `buildWhatsAppUrl(message: string): string`, `buildVehicleInterestMessage(vehicle: Pick<VehiclePublic,'brand'|'model'|'version'|'year_model'>): string`, `buildFinancingMessage(data: { name: string; downPayment?: string; vehicleLabel?: string }): string`, `buildTradeInMessage(data: { name: string; brand: string; model: string; year: number; mileageKm: number }): string`. Used by Tasks 12–19 (home sections, catalog, detail page).

- [ ] **Step 1: Write the failing tests**

`site/tests/lib/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatPriceFromCents, buildVehicleSlug } from '@/lib/format'

describe('formatPriceFromCents', () => {
  it('formats cents as BRL without decimals for whole reais', () => {
    expect(formatPriceFromCents(8990000)).toBe('R$ 89.900')
  })
})

describe('buildVehicleSlug', () => {
  it('builds a lowercase, hyphenated slug with a short id fragment', () => {
    expect(buildVehicleSlug('Volkswagen', 'Polo', 2026, '4f8a91b2')).toBe('volkswagen-polo-2026-4f8a91b2')
  })
})
```

`site/tests/lib/whatsapp.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildWhatsAppUrl, buildVehicleInterestMessage, buildFinancingMessage, buildTradeInMessage, WHATSAPP_NUMBER } from '@/lib/whatsapp'

describe('buildWhatsAppUrl', () => {
  it('encodes the message and targets the store number', () => {
    const url = buildWhatsAppUrl('Olá!')
    expect(url).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!`)
  })
})

describe('buildVehicleInterestMessage', () => {
  it('mentions the vehicle', () => {
    const msg = buildVehicleInterestMessage({ brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', year_model: 2023 })
    expect(msg).toContain('Fiat Argo Drive 1.0 2023')
    expect(msg).toContain('Tenho interesse')
  })
})

describe('buildFinancingMessage', () => {
  it('includes the name and vehicle label', () => {
    const msg = buildFinancingMessage({ name: 'Maria', vehicleLabel: 'Fiat Argo 2023' })
    expect(msg).toContain('Maria')
    expect(msg).toContain('Fiat Argo 2023')
    expect(msg).toContain('financiamento')
  })
})

describe('buildTradeInMessage', () => {
  it('includes the trade-in vehicle details', () => {
    const msg = buildTradeInMessage({ name: 'João', brand: 'Chevrolet', model: 'Onix', year: 2019, mileageKm: 60000 })
    expect(msg).toContain('João')
    expect(msg).toContain('Chevrolet Onix 2019')
    expect(msg).toContain('60000')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/format.test.ts tests/lib/whatsapp.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement the utilities**

`site/src/lib/format.ts`:
```ts
export function formatPriceFromCents(cents: number): string {
  const reais = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(reais).replace('R$', 'R$ ').replace(/\s+/, ' ')
}

export function buildVehicleSlug(brand: string, model: string, yearModel: number, idFragment: string): string {
  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${slugify(brand)}-${slugify(model)}-${yearModel}-${idFragment}`
}
```

`site/src/lib/whatsapp.ts`:
```ts
import type { VehiclePublic } from './types'

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5598991030107'

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function buildVehicleInterestMessage(
  vehicle: Pick<VehiclePublic, 'brand' | 'model' | 'version' | 'year_model'>,
): string {
  const label = [vehicle.brand, vehicle.model, vehicle.version, vehicle.year_model].filter(Boolean).join(' ')
  return `Olá! Tenho interesse no ${label} que vi no site da Aguiar Veículos. Pode me passar mais informações?`
}

export function buildFinancingMessage(data: { name: string; downPayment?: string; vehicleLabel?: string }): string {
  const parts = [
    `Olá! Meu nome é ${data.name} e quero simular um financiamento na Aguiar Veículos.`,
  ]
  if (data.vehicleLabel) parts.push(`Carro de interesse: ${data.vehicleLabel}.`)
  if (data.downPayment) parts.push(`Entrada disponível: ${data.downPayment}.`)
  return parts.join(' ')
}

export function buildTradeInMessage(data: { name: string; brand: string; model: string; year: number; mileageKm: number }): string {
  return `Olá! Meu nome é ${data.name} e quero avaliar meu ${data.brand} ${data.model} ${data.year} (${data.mileageKm} km rodados) para troca na Aguiar Veículos.`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/format.test.ts tests/lib/whatsapp.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/format.ts site/src/lib/whatsapp.ts site/tests/lib/format.test.ts site/tests/lib/whatsapp.test.ts
git commit -m "feat(site): add price/slug formatting and WhatsApp message builders"
```

---

### Task 5: Validation schemas (zod)

**Files:**
- Create: `site/src/lib/validation.ts`
- Test: `site/tests/lib/validation.test.ts`

**Interfaces:**
- Produces: `vehicleFormSchema`, `VehicleFormValues`, `financingLeadSchema`, `FinancingLeadValues`, `tradeInLeadSchema`, `TradeInLeadValues` — consumed by Task 13 (financing/trade-in forms) and Task 22 (admin vehicle form).

- [ ] **Step 1: Write the failing test**

`site/tests/lib/validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { vehicleFormSchema, financingLeadSchema, tradeInLeadSchema } from '@/lib/validation'

describe('vehicleFormSchema', () => {
  it('accepts a valid vehicle', () => {
    const result = vehicleFormSchema.safeParse({
      brand: 'Fiat', model: 'Argo', version: 'Drive 1.0',
      yearModel: 2023, yearFabrication: 2023, mileageKm: 32000,
      priceCents: 6490000, fuelType: 'Flex', transmission: 'Manual',
      color: 'Prata', description: 'Ótimo estado', plate: 'DEF4G56',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a negative price', () => {
    const result = vehicleFormSchema.safeParse({
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe('financingLeadSchema', () => {
  it('requires name and phone', () => {
    expect(financingLeadSchema.safeParse({ name: '', phone: '' }).success).toBe(false)
    expect(financingLeadSchema.safeParse({ name: 'Maria', phone: '98999999999' }).success).toBe(true)
  })
})

describe('tradeInLeadSchema', () => {
  it('requires vehicle details plus name and phone', () => {
    const result = tradeInLeadSchema.safeParse({
      name: 'João', phone: '98988888888', brand: 'Chevrolet', model: 'Onix', year: 2019, mileageKm: 60000,
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/validation.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the schemas**

`site/src/lib/validation.ts`:
```ts
import { z } from 'zod'

export const vehicleFormSchema = z.object({
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  version: z.string().optional(),
  yearModel: z.coerce.number().int().min(1990).max(2100),
  yearFabrication: z.coerce.number().int().min(1990).max(2100),
  mileageKm: z.coerce.number().int().min(0),
  priceCents: z.coerce.number().int().min(0, 'Preço não pode ser negativo'),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  plate: z.string().optional(),
})
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export const financingLeadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z.string().min(8, 'Informe um telefone válido'),
  vehicleId: z.string().uuid().optional(),
  vehicleLabel: z.string().optional(),
  downPayment: z.string().optional(),
})
export type FinancingLeadValues = z.infer<typeof financingLeadSchema>

export const tradeInLeadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z.string().min(8, 'Informe um telefone válido'),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.coerce.number().int().min(1990).max(2100),
  mileageKm: z.coerce.number().int().min(0),
})
export type TradeInLeadValues = z.infer<typeof tradeInLeadSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/validation.ts site/tests/lib/validation.test.ts
git commit -m "feat(site): add zod validation schemas for vehicle and lead forms"
```

---

### Task 6: Vehicle query layer

**Files:**
- Create: `site/src/lib/queries/vehicles.ts`
- Test: `site/tests/lib/queries/vehicles.test.ts`

**Interfaces:**
- Consumes: `VehiclePublic` (Task 3), reads `vehicles_public` view (Task 2).
- Produces: `getFeaturedVehicles(client, limit = 6): Promise<VehiclePublic[]>`, `getAvailableVehicles(client, filters?: VehicleFilters): Promise<VehiclePublic[]>`, `getVehicleBySlug(client, slug: string): Promise<VehiclePublic | null>`, `interface VehicleFilters { brand?: string; minPriceCents?: number; maxPriceCents?: number; year?: number }`. Used by Tasks 12, 18, 19.

- [ ] **Step 1: Write the failing test**

`site/tests/lib/queries/vehicles.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { getFeaturedVehicles, getAvailableVehicles, getVehicleBySlug } from '@/lib/queries/vehicles'

function makeFakeClient(rows: any[]) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(async () => ({ data: rows, error: null })),
    maybeSingle: vi.fn(async () => ({ data: rows[0] ?? null, error: null })),
    then: (resolve: any) => resolve({ data: rows, error: null }),
  }
  return { from: vi.fn(() => chain) }
}

describe('getFeaturedVehicles', () => {
  it('queries vehicles_public filtered by is_featured', async () => {
    const client = makeFakeClient([{ id: '1', slug: 'a', is_featured: true }])
    const result = await getFeaturedVehicles(client as any, 6)
    expect(client.from).toHaveBeenCalledWith('vehicles_public')
    expect(result).toEqual([{ id: '1', slug: 'a', is_featured: true }])
  })
})

describe('getAvailableVehicles', () => {
  it('returns available vehicles applying brand filter', async () => {
    const client = makeFakeClient([{ id: '2', slug: 'b', brand: 'Fiat' }])
    const result = await getAvailableVehicles(client as any, { brand: 'Fiat' })
    expect(result).toEqual([{ id: '2', slug: 'b', brand: 'Fiat' }])
  })
})

describe('getVehicleBySlug', () => {
  it('returns null when no vehicle matches', async () => {
    const client = makeFakeClient([])
    const result = await getVehicleBySlug(client as any, 'nao-existe')
    expect(result).toBeNull()
  })

  it('returns the vehicle when found', async () => {
    const client = makeFakeClient([{ id: '3', slug: 'vw-polo-2026' }])
    const result = await getVehicleBySlug(client as any, 'vw-polo-2026')
    expect(result).toEqual({ id: '3', slug: 'vw-polo-2026' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/queries/vehicles.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the query layer**

`site/src/lib/queries/vehicles.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehiclePublic } from '../types'

export interface VehicleFilters {
  brand?: string
  minPriceCents?: number
  maxPriceCents?: number
  year?: number
}

export async function getFeaturedVehicles(client: SupabaseClient, limit = 6): Promise<VehiclePublic[]> {
  const { data, error } = await client
    .from('vehicles_public')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as VehiclePublic[]
}

export async function getAvailableVehicles(client: SupabaseClient, filters: VehicleFilters = {}): Promise<VehiclePublic[]> {
  let query = client.from('vehicles_public').select('*').eq('status', 'available')
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.year) query = query.eq('year_model', filters.year)
  if (filters.minPriceCents != null) query = query.gte('price_cents', filters.minPriceCents)
  if (filters.maxPriceCents != null) query = query.lte('price_cents', filters.maxPriceCents)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data as VehiclePublic[]
}

export async function getVehicleBySlug(client: SupabaseClient, slug: string): Promise<VehiclePublic | null> {
  const { data, error } = await client.from('vehicles_public').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data as VehiclePublic) ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/queries/vehicles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/queries/vehicles.ts site/tests/lib/queries/vehicles.test.ts
git commit -m "feat(site): add vehicle query layer over vehicles_public view"
```

---

### Task 7: Testimonials and site-settings query layer

**Files:**
- Create: `site/src/lib/queries/testimonials.ts`, `site/src/lib/queries/site-settings.ts`
- Test: `site/tests/lib/queries/testimonials.test.ts`, `site/tests/lib/queries/site-settings.test.ts`

**Interfaces:**
- Produces: `getPublishedTestimonials(client): Promise<Testimonial[]>`; `getSiteSetting(client, key: string): Promise<string | null>`. Used by Tasks 14, 16.

- [ ] **Step 1: Write the failing tests**

`site/tests/lib/queries/testimonials.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { getPublishedTestimonials } from '@/lib/queries/testimonials'

describe('getPublishedTestimonials', () => {
  it('queries testimonials_published ordered by display_order', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      order: vi.fn(async () => ({ data: [{ id: '1', caption: 'Ótimo!' }], error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getPublishedTestimonials(client as any)
    expect(client.from).toHaveBeenCalledWith('testimonials_published')
    expect(result).toEqual([{ id: '1', caption: 'Ótimo!' }])
  })
})
```

`site/tests/lib/queries/site-settings.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { getSiteSetting } from '@/lib/queries/site-settings'

describe('getSiteSetting', () => {
  it('returns the value for a known key', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => ({ data: { value: 'https://example.com/video.mp4' }, error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getSiteSetting(client as any, 'location_video_url')
    expect(result).toBe('https://example.com/video.mp4')
  })

  it('returns null when the key is missing', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getSiteSetting(client as any, 'unknown_key')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd site && npx vitest run tests/lib/queries/testimonials.test.ts tests/lib/queries/site-settings.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement the query layer**

`site/src/lib/queries/testimonials.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Testimonial } from '../types'

export async function getPublishedTestimonials(client: SupabaseClient): Promise<Testimonial[]> {
  const { data, error } = await client
    .from('testimonials_published')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return data as Testimonial[]
}
```

`site/src/lib/queries/site-settings.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getSiteSetting(client: SupabaseClient, key: string): Promise<string | null> {
  const { data, error } = await client.from('site_settings').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data?.value ?? null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site && npx vitest run tests/lib/queries/testimonials.test.ts tests/lib/queries/site-settings.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/queries/testimonials.ts site/src/lib/queries/site-settings.ts site/tests/lib/queries/testimonials.test.ts site/tests/lib/queries/site-settings.test.ts
git commit -m "feat(site): add testimonials and site-settings query layer"
```

---

### Task 8: Brand UI primitives

**Files:**
- Create: `site/src/components/ui/Button.tsx`, `site/src/components/ui/Card.tsx`, `site/src/components/ui/Section.tsx`, `site/src/components/ui/WhatsAppButton.tsx`
- Test: `site/tests/components/ui.test.tsx`

**Interfaces:**
- Consumes: `buildWhatsAppUrl` (Task 4).
- Produces: `<Button variant="primary"|"outline">`, `<Card>`, `<Section title? eyebrow?>`, `<WhatsAppButton message: string>`. Used by every section component from Task 9 onward.

- [ ] **Step 1: Write the failing test**

`site/tests/components/ui.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

describe('UI primitives', () => {
  it('Button primary variant uses the Aguiar Red background', () => {
    render(<Button variant="primary">Ver estoque</Button>)
    expect(screen.getByRole('button', { name: 'Ver estoque' })).toHaveClass('bg-aguiar-red')
  })

  it('Card renders children on a Card Gray background', () => {
    render(<Card>conteúdo</Card>)
    expect(screen.getByText('conteúdo')).toHaveClass('bg-card-gray')
  })

  it('Section renders an eyebrow and a title', () => {
    render(<Section eyebrow="Diferenciais" title="Por que a Aguiar Veículos">conteúdo</Section>)
    expect(screen.getByText('Diferenciais')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Por que a Aguiar Veículos' })).toBeInTheDocument()
  })

  it('WhatsAppButton links to a wa.me URL with the given message', () => {
    render(<WhatsAppButton message="Olá!">Fale conosco</WhatsAppButton>)
    expect(screen.getByRole('link', { name: 'Fale conosco' })).toHaveAttribute(
      'href',
      'https://wa.me/5598991030107?text=Ol%C3%A1!',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/ui.test.tsx`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement the primitives**

`site/src/components/ui/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded px-6 py-3 font-bold uppercase tracking-wide transition-colors'
  const variants = {
    primary: 'bg-aguiar-red text-white hover:bg-red-700',
    outline: 'border-2 border-white text-white hover:bg-white hover:text-graphite',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
```

`site/src/components/ui/Card.tsx`:
```tsx
import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg bg-card-gray p-6 text-graphite ${className}`} {...props} />
}
```

`site/src/components/ui/Section.tsx`:
```tsx
import type { ReactNode } from 'react'

interface SectionProps {
  eyebrow?: string
  title?: string
  children: ReactNode
  className?: string
}

export function Section({ eyebrow, title, children, className = '' }: SectionProps) {
  return (
    <section className={`py-16 px-6 ${className}`}>
      {eyebrow && <p className="mb-2 text-sm font-bold uppercase text-aguiar-red">{eyebrow}</p>}
      {title && <h2 className="mb-8 text-3xl font-bold uppercase">{title}</h2>}
      {children}
    </section>
  )
}
```

`site/src/components/ui/WhatsAppButton.tsx` (a plain `<a>` styled like `Button`, not nested inside one — an `<a>` cannot contain a `<button>`):
```tsx
import type { ReactNode } from 'react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const base = 'inline-flex items-center justify-center rounded px-6 py-3 font-bold uppercase tracking-wide transition-colors'
const variants = {
  primary: 'bg-aguiar-red text-white hover:bg-red-700',
  outline: 'border-2 border-white text-white hover:bg-white hover:text-graphite',
}

interface WhatsAppButtonProps {
  message: string
  children: ReactNode
  variant?: 'primary' | 'outline'
}

export function WhatsAppButton({ message, children, variant = 'primary' }: WhatsAppButtonProps) {
  return (
    <a href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" className={`${base} ${variants[variant]}`}>
      {children}
    </a>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/ui.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/ui site/tests/components/ui.test.tsx
git commit -m "feat(site): add brand UI primitives (Button, Card, Section, WhatsAppButton)"
```

---

### Task 9: Header and Footer

**Files:**
- Create: `site/src/components/layout/Header.tsx`, `site/src/components/layout/Footer.tsx`
- Test: `site/tests/components/layout.test.tsx`

**Interfaces:**
- Consumes: `WhatsAppButton` (Task 8), `WHATSAPP_NUMBER` (Task 4).
- Produces: `<Header />`, `<Footer />`. Used by Task 17 (root page/layout composition).

- [ ] **Step 1: Write the failing test**

`site/tests/components/layout.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

describe('Header', () => {
  it('links to the catalog and to WhatsApp', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })
})

describe('Footer', () => {
  it('shows the store address and Instagram handle', () => {
    render(<Footer />)
    expect(screen.getByText(/Presidente Dutra/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /@aguiarveiculospk/i })).toHaveAttribute(
      'href',
      'https://www.instagram.com/aguiarveiculospk',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/layout.test.tsx`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement Header and Footer**

`site/src/components/layout/Header.tsx`:
```tsx
import Link from 'next/link'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

export function Header() {
  return (
    <header className="flex items-center justify-between bg-graphite px-6 py-4">
      <Link href="/" className="text-xl font-bold uppercase tracking-wide text-white">
        Aguiar <span className="text-aguiar-red">Veículos</span>
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/estoque" className="font-bold uppercase text-white hover:text-aguiar-red">
          Ver estoque
        </Link>
        <WhatsAppButton message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
          WhatsApp
        </WhatsAppButton>
      </nav>
    </header>
  )
}
```

`site/src/components/layout/Footer.tsx`:
```tsx
export function Footer() {
  return (
    <footer className="bg-graphite border-t border-support-gray px-6 py-10 text-support-gray">
      <p className="font-bold text-white">Aguiar Veículos</p>
      <p>BR-135, Campo Dantas, Presidente Dutra - MA</p>
      <p>(98) 99103-0107</p>
      <a
        href="https://www.instagram.com/aguiarveiculospk"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-aguiar-red"
      >
        @aguiarveiculospk
      </a>
    </footer>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/layout.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/layout site/tests/components/layout.test.tsx
git commit -m "feat(site): add Header and Footer components"
```

---

### Task 10: Home — Hero section

**Files:**
- Create: `site/src/components/home/Hero.tsx`
- Test: `site/tests/components/home/Hero.test.tsx`

**Interfaces:**
- Consumes: `WhatsAppButton` (Task 8).
- Produces: `<Hero />`. Consumed by Task 17 (home composition).

- [ ] **Step 1: Write the failing test**

`site/tests/components/home/Hero.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/home/Hero'

describe('Hero', () => {
  it('shows the brand headline and both CTAs', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/aguiar veículos/i)
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/home/Hero.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement Hero**

`site/src/components/home/Hero.tsx`:
```tsx
import Link from 'next/link'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

export function Hero() {
  return (
    <section className="flex flex-col items-start gap-6 bg-graphite px-6 py-24">
      <p className="text-sm font-bold uppercase tracking-widest text-aguiar-red">
        15 anos realizando sonhos sobre rodas
      </p>
      <h1 className="max-w-3xl text-5xl font-bold uppercase leading-tight text-white">
        Aguiar Veículos — sua confiança nos leva cada vez mais longe
      </h1>
      <p className="max-w-xl text-support-gray">
        Mais de 30 veículos novos e seminovos à pronta entrega em Presidente Dutra - MA,
        com procedência garantida e financiamento facilitado.
      </p>
      <div className="flex gap-4">
        <Link
          href="/estoque"
          className="inline-flex items-center justify-center rounded bg-aguiar-red px-6 py-3 font-bold uppercase text-white hover:bg-red-700"
        >
          Ver estoque
        </Link>
        <WhatsAppButton variant="outline" message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
          Falar no WhatsApp
        </WhatsAppButton>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/home/Hero.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/home/Hero.tsx site/tests/components/home/Hero.test.tsx
git commit -m "feat(site): add home Hero section"
```

---

### Task 11: Home — Diferenciais section

**Files:**
- Create: `site/src/components/home/Diferenciais.tsx`
- Test: `site/tests/components/home/Diferenciais.test.tsx`

**Interfaces:**
- Consumes: `Card`, `Section` (Task 8).
- Produces: `<Diferenciais />`. Consumed by Task 17.

- [ ] **Step 1: Write the failing test**

`site/tests/components/home/Diferenciais.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Diferenciais } from '@/components/home/Diferenciais'

describe('Diferenciais', () => {
  it('renders all five differentiators from marketing/estrategia.md', () => {
    render(<Diferenciais />)
    expect(screen.getByText(/procedência garantida/i)).toBeInTheDocument()
    expect(screen.getByText(/financiamento em até 60x/i)).toBeInTheDocument()
    expect(screen.getByText(/mais de 10 bancos/i)).toBeInTheDocument()
    expect(screen.getByText(/aceita seu carro ou moto na troca/i)).toBeInTheDocument()
    expect(screen.getByText(/revisados e higienizados/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/home/Diferenciais.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement Diferenciais**

`site/src/components/home/Diferenciais.tsx`:
```tsx
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

const ITEMS = [
  { title: 'Procedência garantida', text: 'Todo veículo passa por checagem de procedência antes de entrar no estoque.' },
  { title: 'Financiamento em até 60x', text: 'Parcelamos sua entrada e financiamos em até 60 vezes.' },
  { title: 'Mais de 10 bancos parceiros', text: 'Trabalhamos com mais de 10 bancos para aumentar sua chance de aprovação.' },
  { title: 'Aceita seu carro ou moto na troca', text: 'Recebemos seu usado como parte do pagamento.' },
  { title: 'Revisados e higienizados', text: 'Veículos revisados, higienizados e com garantia.' },
]

export function Diferenciais() {
  return (
    <Section eyebrow="Por que comprar com a gente" title="Diferenciais Aguiar Veículos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map((item) => (
          <Card key={item.title}>
            <p className="font-bold uppercase">{item.title}</p>
            <p className="mt-2 text-sm text-support-gray">{item.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/home/Diferenciais.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/home/Diferenciais.tsx site/tests/components/home/Diferenciais.test.tsx
git commit -m "feat(site): add home Diferenciais section"
```

---

### Task 12: Home — Estoque em destaque section

**Files:**
- Create: `site/src/components/home/EstoqueDestaque.tsx`
- Test: `site/tests/components/home/EstoqueDestaque.test.tsx`

**Interfaces:**
- Consumes: `getFeaturedVehicles` (Task 6), `formatPriceFromCents` (Task 4), `Section` (Task 8).
- Produces: `<EstoqueDestaque client={SupabaseClient} />` (async server component). Consumed by Task 17.

- [ ] **Step 1: Write the failing test**

`site/tests/components/home/EstoqueDestaque.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { EstoqueDestaque } from '@/components/home/EstoqueDestaque'

function fakeClient(rows: any[]) {
  const chain: any = {
    select: () => chain, eq: () => chain, order: () => chain,
    limit: async () => ({ data: rows, error: null }),
  }
  return { from: () => chain } as any
}

describe('EstoqueDestaque', () => {
  it('renders a card per featured vehicle with brand, model and price', async () => {
    const client = fakeClient([
      { id: '1', slug: 'vw-polo-2026', brand: 'Volkswagen', model: 'Polo', version: 'Comfortline', year_model: 2026, price_cents: 8990000 },
    ])
    render(await EstoqueDestaque({ client }))
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.getByText('R$ 89.900')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver todo o estoque/i })).toHaveAttribute('href', '/estoque')
  })

  it('renders nothing visible when there are no featured vehicles', async () => {
    const client = fakeClient([])
    const { container } = render(await EstoqueDestaque({ client }))
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/home/EstoqueDestaque.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement EstoqueDestaque**

`site/src/components/home/EstoqueDestaque.tsx`:
```tsx
import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getFeaturedVehicles } from '@/lib/queries/vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

export async function EstoqueDestaque({ client }: { client: SupabaseClient }) {
  const vehicles = await getFeaturedVehicles(client)
  if (vehicles.length === 0) return null

  return (
    <Section eyebrow="Estoque" title="Destaques da semana">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Link key={vehicle.id} href={`/estoque/${vehicle.slug}`}>
            <Card>
              <p className="font-bold uppercase">
                {vehicle.brand} {vehicle.model} {vehicle.version}
              </p>
              <p className="text-sm text-support-gray">{vehicle.year_model}</p>
              <p className="mt-2 text-lg font-bold text-aguiar-red">{formatPriceFromCents(vehicle.price_cents)}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Link href="/estoque" className="mt-8 inline-block font-bold uppercase text-aguiar-red hover:underline">
        Ver todo o estoque
      </Link>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/home/EstoqueDestaque.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/home/EstoqueDestaque.tsx site/tests/components/home/EstoqueDestaque.test.tsx
git commit -m "feat(site): add home Estoque em destaque section with empty-state handling"
```

---

### Task 13: Lead creation action + Home Financiamento/Avaliação section

**Files:**
- Create: `site/src/lib/actions/leads.ts`, `site/src/app/actions/leads.ts`, `site/src/components/home/FinanciamentoAvaliacao.tsx`
- Test: `site/tests/lib/actions/leads.test.ts`, `site/tests/components/home/FinanciamentoAvaliacao.test.tsx`

**Interfaces:**
- Consumes: `financingLeadSchema`, `tradeInLeadSchema` (Task 5), `buildWhatsAppUrl`, `buildFinancingMessage`, `buildTradeInMessage` (Task 4), `createServerSupabaseClient` (Task 3).
- Produces: `createLead(client, input: CreateLeadInput): Promise<{ id: string }>` (DI, unit-testable); server actions `submitFinancingLead(input: FinancingLeadValues)`, `submitTradeInLead(input: TradeInLeadValues)` (`'use server'`); `<FinanciamentoAvaliacao />`. Consumed by Task 17.

- [ ] **Step 1: Write the failing test for the DI lead action**

`site/tests/lib/actions/leads.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { createLead } from '@/lib/actions/leads'

describe('createLead', () => {
  it('inserts a lead row and returns its id', async () => {
    const chain: any = {
      insert: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: { id: 'lead-1' }, error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await createLead(client as any, {
      type: 'financing', name: 'Maria', phone: '98999999999', details: { downPayment: '5000' },
    })
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.insert).toHaveBeenCalledWith({
      type: 'financing', name: 'Maria', phone: '98999999999',
      details: { downPayment: '5000' }, vehicle_id: null,
    })
    expect(result).toEqual({ id: 'lead-1' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/actions/leads.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `createLead` and the server action wrappers**

`site/src/lib/actions/leads.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead, LeadType } from '../types'

export interface CreateLeadInput {
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown>
  vehicleId?: string
}

export async function createLead(client: SupabaseClient, input: CreateLeadInput): Promise<Pick<Lead, 'id'>> {
  const { data, error } = await client
    .from('leads')
    .insert({
      type: input.type,
      name: input.name,
      phone: input.phone,
      details: input.details,
      vehicle_id: input.vehicleId ?? null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data as Pick<Lead, 'id'>
}
```

`site/src/app/actions/leads.ts`:
```ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLead } from '@/lib/actions/leads'
import { financingLeadSchema, tradeInLeadSchema, type FinancingLeadValues, type TradeInLeadValues } from '@/lib/validation'

export async function submitFinancingLead(input: FinancingLeadValues) {
  const values = financingLeadSchema.parse(input)
  const client = await createServerSupabaseClient()
  return createLead(client, {
    type: 'financing',
    name: values.name,
    phone: values.phone,
    details: { vehicleLabel: values.vehicleLabel ?? null, downPayment: values.downPayment ?? null },
    vehicleId: values.vehicleId,
  })
}

export async function submitTradeInLead(input: TradeInLeadValues) {
  const values = tradeInLeadSchema.parse(input)
  const client = await createServerSupabaseClient()
  return createLead(client, {
    type: 'trade_in',
    name: values.name,
    phone: values.phone,
    details: { brand: values.brand, model: values.model, year: values.year, mileageKm: values.mileageKm },
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/actions/leads.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the form section**

`site/tests/components/home/FinanciamentoAvaliacao.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const submitFinancingLead = vi.fn(async () => ({ id: 'lead-1' }))
const submitTradeInLead = vi.fn(async () => ({ id: 'lead-2' }))
vi.mock('@/app/actions/leads', () => ({ submitFinancingLead, submitTradeInLead }))

import { FinanciamentoAvaliacao } from '@/components/home/FinanciamentoAvaliacao'

beforeEach(() => {
  submitFinancingLead.mockClear()
  submitTradeInLead.mockClear()
  // @ts-expect-error - jsdom location is reassignable for this test
  delete window.location
  // @ts-expect-error
  window.location = { href: '' }
})

describe('FinanciamentoAvaliacao', () => {
  it('submits the financing form, saves the lead, and opens WhatsApp', async () => {
    render(<FinanciamentoAvaliacao />)
    fireEvent.change(screen.getByLabelText(/nome \(financiamento\)/i), { target: { value: 'Maria' } })
    fireEvent.change(screen.getByLabelText(/telefone \(financiamento\)/i), { target: { value: '98999999999' } })
    fireEvent.click(screen.getByRole('button', { name: /simular financiamento/i }))

    await waitFor(() => expect(submitFinancingLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Maria', phone: '98999999999' }),
    ))
    expect(window.location.href).toContain('https://wa.me/5598991030107?text=')
    expect(window.location.href).toContain('financiamento')
  })

  it('submits the trade-in form, saves the lead, and opens WhatsApp', async () => {
    render(<FinanciamentoAvaliacao />)
    fireEvent.change(screen.getByLabelText(/nome \(avaliação\)/i), { target: { value: 'João' } })
    fireEvent.change(screen.getByLabelText(/telefone \(avaliação\)/i), { target: { value: '98988888888' } })
    fireEvent.change(screen.getByLabelText(/marca do seu carro/i), { target: { value: 'Chevrolet' } })
    fireEvent.change(screen.getByLabelText(/modelo do seu carro/i), { target: { value: 'Onix' } })
    fireEvent.change(screen.getByLabelText(/ano do seu carro/i), { target: { value: '2019' } })
    fireEvent.change(screen.getByLabelText(/km rodados/i), { target: { value: '60000' } })
    fireEvent.click(screen.getByRole('button', { name: /avaliar meu carro/i }))

    await waitFor(() => expect(submitTradeInLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João', brand: 'Chevrolet', model: 'Onix' }),
    ))
    expect(window.location.href).toContain('https://wa.me/5598991030107?text=')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/home/FinanciamentoAvaliacao.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Implement the section**

`site/src/components/home/FinanciamentoAvaliacao.tsx`:
```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { submitFinancingLead, submitTradeInLead } from '@/app/actions/leads'
import { buildWhatsAppUrl, buildFinancingMessage, buildTradeInMessage } from '@/lib/whatsapp'
import { financingLeadSchema, tradeInLeadSchema } from '@/lib/validation'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function FinanciamentoAvaliacao() {
  const [financingError, setFinancingError] = useState<string | null>(null)
  const [tradeInError, setTradeInError] = useState<string | null>(null)

  async function handleFinancingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = financingLeadSchema.safeParse({
      name: formData.get('name'),
      phone: formData.get('phone'),
      downPayment: formData.get('downPayment') || undefined,
    })
    if (!parsed.success) {
      setFinancingError('Preencha nome e telefone para simular.')
      return
    }
    setFinancingError(null)
    await submitFinancingLead(parsed.data)
    window.location.href = buildWhatsAppUrl(buildFinancingMessage(parsed.data))
  }

  async function handleTradeInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = tradeInLeadSchema.safeParse({
      name: formData.get('name'),
      phone: formData.get('phone'),
      brand: formData.get('brand'),
      model: formData.get('model'),
      year: formData.get('year'),
      mileageKm: formData.get('mileageKm'),
    })
    if (!parsed.success) {
      setTradeInError('Preencha todos os campos para avaliar seu carro.')
      return
    }
    setTradeInError(null)
    await submitTradeInLead(parsed.data)
    window.location.href = buildWhatsAppUrl(buildTradeInMessage(parsed.data))
  }

  return (
    <Section eyebrow="Facilita pra você" title="Financiamento e avaliação">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={handleFinancingSubmit} className="flex flex-col gap-3">
            <h3 className="font-bold uppercase">Simular financiamento</h3>
            <label htmlFor="financing-name">Nome (financiamento)</label>
            <input id="financing-name" name="name" className="rounded border p-2" />
            <label htmlFor="financing-phone">Telefone (financiamento)</label>
            <input id="financing-phone" name="phone" className="rounded border p-2" />
            <label htmlFor="financing-down-payment">Entrada disponível (opcional)</label>
            <input id="financing-down-payment" name="downPayment" className="rounded border p-2" />
            {financingError && <p className="text-aguiar-red">{financingError}</p>}
            <Button type="submit">Simular financiamento</Button>
          </form>
        </Card>
        <Card>
          <form onSubmit={handleTradeInSubmit} className="flex flex-col gap-3">
            <h3 className="font-bold uppercase">Avaliar meu carro para troca</h3>
            <label htmlFor="trade-in-name">Nome (avaliação)</label>
            <input id="trade-in-name" name="name" className="rounded border p-2" />
            <label htmlFor="trade-in-phone">Telefone (avaliação)</label>
            <input id="trade-in-phone" name="phone" className="rounded border p-2" />
            <label htmlFor="trade-in-brand">Marca do seu carro</label>
            <input id="trade-in-brand" name="brand" className="rounded border p-2" />
            <label htmlFor="trade-in-model">Modelo do seu carro</label>
            <input id="trade-in-model" name="model" className="rounded border p-2" />
            <label htmlFor="trade-in-year">Ano do seu carro</label>
            <input id="trade-in-year" name="year" type="number" className="rounded border p-2" />
            <label htmlFor="trade-in-mileage">Km rodados</label>
            <input id="trade-in-mileage" name="mileageKm" type="number" className="rounded border p-2" />
            {tradeInError && <p className="text-aguiar-red">{tradeInError}</p>}
            <Button type="submit">Avaliar meu carro</Button>
          </form>
        </Card>
      </div>
    </Section>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/home/FinanciamentoAvaliacao.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/actions/leads.ts site/src/app/actions/leads.ts site/src/components/home/FinanciamentoAvaliacao.tsx site/tests/lib/actions/leads.test.ts site/tests/components/home/FinanciamentoAvaliacao.test.tsx
git commit -m "feat(site): add lead creation action and Financiamento/Avaliação section"
```

---

### Task 14: Home — Depoimentos section

**Files:**
- Create: `site/src/components/home/Depoimentos.tsx`
- Test: `site/tests/components/home/Depoimentos.test.tsx`

**Interfaces:**
- Consumes: `getPublishedTestimonials` (Task 7), `Section` (Task 8).
- Produces: `<Depoimentos client={SupabaseClient} />` (async server component). Consumed by Task 17.

- [ ] **Step 1: Write the failing test**

`site/tests/components/home/Depoimentos.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Depoimentos } from '@/components/home/Depoimentos'

function fakeClient(rows: any[]) {
  const chain: any = { select: () => chain, order: async () => ({ data: rows, error: null }) }
  return { from: () => chain } as any
}

describe('Depoimentos', () => {
  it('renders one card per published testimonial', async () => {
    const client = fakeClient([
      { id: '1', image_url: 'https://x/1.jpg', caption: 'Realizei meu sonho! 🙏' },
    ])
    render(await Depoimentos({ client }))
    expect(screen.getByText('Realizei meu sonho! 🙏')).toBeInTheDocument()
    expect(screen.getByAltText(/depoimento de cliente/i)).toHaveAttribute('src', 'https://x/1.jpg')
  })

  it('renders nothing visible when there are no published testimonials', async () => {
    const client = fakeClient([])
    const { container } = render(await Depoimentos({ client }))
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/home/Depoimentos.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement Depoimentos**

`site/src/components/home/Depoimentos.tsx`:
```tsx
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPublishedTestimonials } from '@/lib/queries/testimonials'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

export async function Depoimentos({ client }: { client: SupabaseClient }) {
  const testimonials = await getPublishedTestimonials(client)
  if (testimonials.length === 0) return null

  return (
    <Section eyebrow="Quem compra recomenda" title="Depoimentos">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="min-w-[280px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={testimonial.image_url} alt="Depoimento de cliente Aguiar Veículos" className="mb-4 rounded" />
            <p>{testimonial.caption}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/home/Depoimentos.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/home/Depoimentos.tsx site/tests/components/home/Depoimentos.test.tsx
git commit -m "feat(site): add home Depoimentos section with empty-state handling"
```

---

### Task 15: Home — "Por que a Aguiar Veículos" and "15 anos" sections

**Files:**
- Create: `site/src/components/home/PorQueAguiar.tsx`, `site/src/components/home/QuinzeAnos.tsx`
- Test: `site/tests/components/home/PorQueAguiar.test.tsx`, `site/tests/components/home/QuinzeAnos.test.tsx`

**Interfaces:**
- Consumes: `Section` (Task 8).
- Produces: `<PorQueAguiar />`, `<QuinzeAnos />`. Consumed by Task 17.

Founder photo/story is pending real content (spec's "Itens em aberto" #1) — this task ships the section with the confirmed copy from `contexto/empresa.md`/`marketing/voz-e-tom.md` and a labeled placeholder image path (`/images/antonio-aguiar.jpg`) that the team drops a real photo into later; it is not a TODO in the code, it is a real `<img>` pointing at a documented, swappable path.

- [ ] **Step 1: Write the failing tests**

`site/tests/components/home/PorQueAguiar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { PorQueAguiar } from '@/components/home/PorQueAguiar'

describe('PorQueAguiar', () => {
  it('renders the three trust pillars', () => {
    render(<PorQueAguiar />)
    expect(screen.getByText(/procedência e transparência/i)).toBeInTheDocument()
    expect(screen.getByText(/financiamento facilitado/i)).toBeInTheDocument()
    expect(screen.getByText(/clientes que voltam/i)).toBeInTheDocument()
  })
})
```

`site/tests/components/home/QuinzeAnos.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { QuinzeAnos } from '@/components/home/QuinzeAnos'

describe('QuinzeAnos', () => {
  it('tells the 15-year story and names Antonio Aguiar', () => {
    render(<QuinzeAnos />)
    expect(screen.getByText(/antonio aguiar/i)).toBeInTheDocument()
    expect(screen.getByText(/15 anos/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd site && npx vitest run tests/components/home/PorQueAguiar.test.tsx tests/components/home/QuinzeAnos.test.tsx`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement both sections**

`site/src/components/home/PorQueAguiar.tsx`:
```tsx
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

const PILLARS = [
  { title: 'Procedência e transparência', text: 'Nunca escondemos a história do veículo — você compra sabendo exatamente o que está levando.' },
  { title: 'Financiamento facilitado', text: 'Parceria com mais de 10 bancos pra você sair de carro novo sem enrolação.' },
  { title: 'Clientes que voltam', text: 'A maior parte da nossa clientela chega por indicação de quem já comprou com a gente.' },
]

export function PorQueAguiar() {
  return (
    <Section eyebrow="Nossa essência" title="Por que a Aguiar Veículos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <Card key={pillar.title}>
            <p className="font-bold uppercase">{pillar.title}</p>
            <p className="mt-2 text-sm text-support-gray">{pillar.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
```

`site/src/components/home/QuinzeAnos.tsx`:
```tsx
import { Section } from '@/components/ui/Section'

export function QuinzeAnos() {
  return (
    <Section eyebrow="Quem está por trás" title="15 anos realizando sonhos sobre rodas">
      <div className="flex flex-col items-center gap-8 lg:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/antonio-aguiar.jpg"
          alt="Antonio Aguiar, fundador da Aguiar Veículos"
          className="w-full max-w-sm rounded-lg lg:w-1/3"
        />
        <p className="max-w-xl text-support-gray">
          Há mais de 15 anos, Antonio Aguiar construiu a Aguiar Veículos em Presidente Dutra - MA
          com um compromisso simples: procedência, confiança e compromisso em cada venda. Hoje a
          loja atende famílias de toda a região do interior do Maranhão, sempre tratando cada carro
          vendido como um sonho realizado.
        </p>
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site && npx vitest run tests/components/home/PorQueAguiar.test.tsx tests/components/home/QuinzeAnos.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/home/PorQueAguiar.tsx site/src/components/home/QuinzeAnos.tsx site/tests/components/home/PorQueAguiar.test.tsx site/tests/components/home/QuinzeAnos.test.tsx
git commit -m "feat(site): add Por que a Aguiar Veículos and 15 anos sections"
```

---

### Task 16: Home — Galeria and Contato sections

**Files:**
- Create: `site/src/components/home/Galeria.tsx`, `site/src/components/home/Contato.tsx`
- Test: `site/tests/components/home/Contato.test.tsx`

**Interfaces:**
- Consumes: `getSiteSetting` (Task 7), `WhatsAppButton` (Task 8).
- Produces: `<Galeria />`, `<Contato client={SupabaseClient} />` (async server component). Consumed by Task 17.

- [ ] **Step 1: Write the failing test (Contato — Galeria is static, verified by the Task 17 full-page test)**

`site/tests/components/home/Contato.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Contato } from '@/components/home/Contato'

function fakeClient(value: string | null) {
  const chain: any = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: value ? { value } : null, error: null }) }
  return { from: () => chain } as any
}

describe('Contato', () => {
  it('shows the address, phone, and the location video when set', async () => {
    const client = fakeClient('https://example.com/como-chegar.mp4')
    render(await Contato({ client }))
    expect(screen.getByText(/BR-135, Campo Dantas/i)).toBeInTheDocument()
    expect(screen.getByText(/99103-0107/)).toBeInTheDocument()
    expect(screen.getByTestId('location-video')).toHaveAttribute('src', 'https://example.com/como-chegar.mp4')
  })

  it('hides the video block when no location video is set', async () => {
    const client = fakeClient(null)
    render(await Contato({ client }))
    expect(screen.queryByTestId('location-video')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/home/Contato.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement Galeria and Contato**

`site/src/components/home/Galeria.tsx`:
```tsx
import { Section } from '@/components/ui/Section'

const PHOTOS = ['/images/loja-1.jpg', '/images/loja-2.jpg', '/images/loja-3.jpg', '/images/loja-4.jpg']

export function Galeria() {
  return (
    <Section eyebrow="Conheça a loja" title="Showroom Aguiar Veículos">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PHOTOS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="Showroom da Aguiar Veículos" className="aspect-square w-full rounded object-cover" />
        ))}
      </div>
    </Section>
  )
}
```

`site/src/components/home/Contato.tsx`:
```tsx
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { Section } from '@/components/ui/Section'

export async function Contato({ client }: { client: SupabaseClient }) {
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')

  return (
    <Section eyebrow="Venha nos visitar" title="Contato">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p>BR-135, Campo Dantas, Presidente Dutra - MA</p>
          <p>(98) 99103-0107</p>
          <a
            href="https://www.instagram.com/aguiarveiculospk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-aguiar-red hover:underline"
          >
            @aguiarveiculospk
          </a>
          <iframe
            title="Mapa até a Aguiar Veículos"
            src="https://www.google.com/maps?q=BR-135,+Campo+Dantas,+Presidente+Dutra+-+MA&output=embed"
            className="mt-4 h-64 w-full rounded"
          />
          <WhatsAppButton message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
            Falar no WhatsApp
          </WhatsAppButton>
        </div>
        {locationVideoUrl && (
          <video data-testid="location-video" src={locationVideoUrl} controls className="w-full rounded" />
        )}
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/home/Contato.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/components/home/Galeria.tsx site/src/components/home/Contato.tsx site/tests/components/home/Contato.test.tsx
git commit -m "feat(site): add Galeria and Contato sections with optional location video"
```

---

### Task 17: Assemble the home page

**Files:**
- Modify: `site/src/app/page.tsx` (replace the Task 1 placeholder), `site/src/app/layout.tsx` (add Header/Footer)
- Test: `site/tests/app/page.test.tsx` (replace the Task 1 smoke test)

**Interfaces:**
- Consumes: `Hero` (10), `Diferenciais` (11), `EstoqueDestaque` (12), `FinanciamentoAvaliacao` (13), `Depoimentos` (14), `PorQueAguiar`/`QuinzeAnos` (15), `Galeria`/`Contato` (16), `Header`/`Footer` (9), `createServerSupabaseClient` (3).
- Produces: the full `/` route in the order defined by the spec's site map §Mapa do site.

- [ ] **Step 1: Replace the failing/outdated smoke test with the full-page order test**

`site/tests/app/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => ({
      select: function () { return this },
      eq: function () { return this },
      order: async () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      limit: async () => ({ data: [], error: null }),
    }),
  })),
}))

import Home from '@/app/page'

describe('Home page', () => {
  it('renders sections in the spec order: hero, diferenciais, por que Aguiar, galeria, contato', async () => {
    render(await Home())
    const headings = screen.getAllByRole('heading', { level: 1 }).concat(screen.getAllByRole('heading', { level: 2 }))
    const text = headings.map((h) => h.textContent)
    expect(text[0]).toMatch(/aguiar veículos/i)
    expect(text).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/diferenciais/i),
        expect.stringMatching(/financiamento e avaliação/i),
        expect.stringMatching(/por que a aguiar veículos/i),
        expect.stringMatching(/15 anos/i),
        expect.stringMatching(/showroom/i),
        expect.stringMatching(/contato/i),
      ]),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/app/page.test.tsx`
Expected: FAIL — `page.tsx` still only renders the Task 1 placeholder heading, so most of these headings are missing.

- [ ] **Step 3: Implement the full home page**

`site/src/app/page.tsx`:
```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Hero } from '@/components/home/Hero'
import { Diferenciais } from '@/components/home/Diferenciais'
import { EstoqueDestaque } from '@/components/home/EstoqueDestaque'
import { FinanciamentoAvaliacao } from '@/components/home/FinanciamentoAvaliacao'
import { Depoimentos } from '@/components/home/Depoimentos'
import { PorQueAguiar } from '@/components/home/PorQueAguiar'
import { QuinzeAnos } from '@/components/home/QuinzeAnos'
import { Galeria } from '@/components/home/Galeria'
import { Contato } from '@/components/home/Contato'

export default async function Home() {
  const client = await createServerSupabaseClient()

  return (
    <main>
      <Hero />
      <Diferenciais />
      <EstoqueDestaque client={client} />
      <FinanciamentoAvaliacao />
      <Depoimentos client={client} />
      <PorQueAguiar />
      <QuinzeAnos />
      <Galeria />
      <Contato client={client} />
    </main>
  )
}
```

`site/src/app/layout.tsx` (add Header/Footer around the page content):
```tsx
import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aguiar Veículos — Novos e Seminovos em Presidente Dutra - MA',
  description:
    'Aguiar Veículos: mais de 15 anos vendendo carros novos e seminovos com procedência em Presidente Dutra - MA. Financiamento facilitado e troca do seu usado.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/app/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/app/page.tsx site/src/app/layout.tsx site/tests/app/page.test.tsx
git commit -m "feat(site): assemble the full home page in spec order"
```

---

### Task 18: `/estoque` catalog page

**Files:**
- Create: `site/src/lib/filter-vehicles.ts`, `site/src/components/catalog/VehicleFilters.tsx`, `site/src/app/estoque/page.tsx`
- Test: `site/tests/lib/filter-vehicles.test.ts`, `site/tests/app/estoque/page.test.tsx`

**Interfaces:**
- Consumes: `getAvailableVehicles`, `VehicleFilters` type (Task 6), `formatPriceFromCents` (Task 4), `createServerSupabaseClient` (Task 3).
- Produces: `parseVehicleFiltersFromSearchParams(searchParams: Record<string,string|undefined>): VehicleFilters`; the `/estoque` route. Consumed by Task 19 (links back) and manual test flow.

- [ ] **Step 1: Write the failing test for search-param parsing**

`site/tests/lib/filter-vehicles.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseVehicleFiltersFromSearchParams } from '@/lib/filter-vehicles'

describe('parseVehicleFiltersFromSearchParams', () => {
  it('parses brand, year, and price range from query params', () => {
    const filters = parseVehicleFiltersFromSearchParams({ brand: 'Fiat', year: '2023', minPrice: '5000000', maxPrice: '9000000' })
    expect(filters).toEqual({ brand: 'Fiat', year: 2023, minPriceCents: 5000000, maxPriceCents: 9000000 })
  })

  it('omits keys that are missing or empty', () => {
    expect(parseVehicleFiltersFromSearchParams({})).toEqual({})
    expect(parseVehicleFiltersFromSearchParams({ brand: '' })).toEqual({})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/filter-vehicles.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the parser**

`site/src/lib/filter-vehicles.ts`:
```ts
import type { VehicleFilters } from './queries/vehicles'

export function parseVehicleFiltersFromSearchParams(params: Record<string, string | undefined>): VehicleFilters {
  const filters: VehicleFilters = {}
  if (params.brand) filters.brand = params.brand
  if (params.year) filters.year = Number(params.year)
  if (params.minPrice) filters.minPriceCents = Number(params.minPrice)
  if (params.maxPrice) filters.maxPriceCents = Number(params.maxPrice)
  return filters
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/filter-vehicles.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the catalog page**

`site/tests/app/estoque/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => ({
      select: function () { return this },
      eq: function () { return this },
      gte: function () { return this },
      lte: function () { return this },
      order: async () => ({
        data: [{ id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive', year_model: 2023, price_cents: 6490000 }],
        error: null,
      }),
    }),
  })),
}))

import EstoquePage from '@/app/estoque/page'

describe('/estoque page', () => {
  it('lists available vehicles with a link to their detail page', async () => {
    render(await EstoquePage({ searchParams: Promise.resolve({}) }))
    const link = screen.getByRole('link', { name: /fiat argo/i })
    expect(link).toHaveAttribute('href', '/estoque/fiat-argo-2023')
    expect(screen.getByText('R$ 64.900')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/app/estoque/page.test.tsx`
Expected: FAIL — route module doesn't exist.

- [ ] **Step 7: Implement the filter UI and the page**

`site/src/components/catalog/VehicleFilters.tsx`:
```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function VehicleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/estoque?${params.toString()}`)
  }

  return (
    <div className="mb-8 flex flex-wrap gap-4">
      <input
        aria-label="Filtrar por marca"
        placeholder="Marca"
        defaultValue={searchParams.get('brand') ?? ''}
        onBlur={(e) => updateParam('brand', e.target.value)}
        className="rounded border p-2 text-graphite"
      />
      <input
        aria-label="Filtrar por ano"
        placeholder="Ano"
        defaultValue={searchParams.get('year') ?? ''}
        onBlur={(e) => updateParam('year', e.target.value)}
        className="rounded border p-2 text-graphite"
      />
    </div>
  )
}
```

`site/src/app/estoque/page.tsx`:
```tsx
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAvailableVehicles } from '@/lib/queries/vehicles'
import { parseVehicleFiltersFromSearchParams } from '@/lib/filter-vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { VehicleFilters } from '@/components/catalog/VehicleFilters'

interface EstoquePageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const params = await searchParams
  const client = await createServerSupabaseClient()
  const vehicles = await getAvailableVehicles(client, parseVehicleFiltersFromSearchParams(params))

  return (
    <main className="px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold uppercase">Estoque completo</h1>
      <VehicleFilters />
      {vehicles.length === 0 ? (
        <p className="text-support-gray">Nenhum veículo encontrado com esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/estoque/${vehicle.slug}`}>
              <Card>
                <p className="font-bold uppercase">
                  {vehicle.brand} {vehicle.model} {vehicle.version}
                </p>
                <p className="text-sm text-support-gray">{vehicle.year_model}</p>
                <p className="mt-2 text-lg font-bold text-aguiar-red">{formatPriceFromCents(vehicle.price_cents)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/app/estoque/page.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/filter-vehicles.ts site/src/components/catalog/VehicleFilters.tsx site/src/app/estoque/page.tsx site/tests/lib/filter-vehicles.test.ts site/tests/app/estoque/page.test.tsx
git commit -m "feat(site): add /estoque catalog page with brand/year/price filters"
```

---

### Task 19: `/estoque/[slug]` vehicle detail page

**Files:**
- Create: `site/src/app/estoque/[slug]/page.tsx`, `site/src/app/estoque/[slug]/not-found.tsx`
- Test: `site/tests/app/estoque/slug-page.test.tsx`

**Interfaces:**
- Consumes: `getVehicleBySlug` (Task 6), `formatPriceFromCents`, `buildVehicleInterestMessage`, `buildWhatsAppUrl` (Task 4), `createServerSupabaseClient` (Task 3).
- Produces: the `/estoque/[slug]` route, including the 404 case from the spec's Erros e casos-limite section.

- [ ] **Step 1: Write the failing tests**

`site/tests/app/estoque/slug-page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { notFound } from 'next/navigation'

vi.mock('next/navigation', () => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))

const maybeSingle = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => ({ select: function () { return this }, eq: function () { return this }, maybeSingle },
    }),
  })),
}))

import VehicleDetailPage from '@/app/estoque/[slug]/page'

describe('/estoque/[slug] page', () => {
  it('renders vehicle details, price, and a WhatsApp interest link, never the plate', async () => {
    // Defensive: even if a future bug lets `plate` leak through the query result,
    // the page must never render it.
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive 1.0',
        year_model: 2023, year_fabrication: 2023, mileage_km: 32000, price_cents: 6490000,
        fuel_type: 'Flex', transmission: 'Manual', color: 'Prata', description: 'Ótimo estado',
        status: 'available', plate: 'DEF4G56',
      },
      error: null,
    })
    render(await VehicleDetailPage({ params: Promise.resolve({ slug: 'fiat-argo-2023' }) }))
    expect(screen.getByText('R$ 64.900')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tenho interesse/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    )
    expect(document.body.textContent).not.toContain('DEF4G56')
  })

  it('calls notFound() when the vehicle does not exist', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    await expect(VehicleDetailPage({ params: Promise.resolve({ slug: 'nao-existe' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/app/estoque/slug-page.test.tsx`
Expected: FAIL — route module doesn't exist.

- [ ] **Step 3: Implement the detail page and the not-found view**

`site/src/app/estoque/[slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleBySlug } from '@/lib/queries/vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { buildWhatsAppUrl, buildVehicleInterestMessage } from '@/lib/whatsapp'

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleBySlug(client, slug)

  if (!vehicle) notFound()

  return (
    <main className="px-6 py-16">
      <h1 className="text-3xl font-bold uppercase">
        {vehicle.brand} {vehicle.model} {vehicle.version}
      </h1>
      <p className="mt-2 text-2xl font-bold text-aguiar-red">{formatPriceFromCents(vehicle.price_cents)}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div><dt className="text-support-gray">Ano</dt><dd>{vehicle.year_model}/{vehicle.year_fabrication}</dd></div>
        <div><dt className="text-support-gray">Km</dt><dd>{vehicle.mileage_km.toLocaleString('pt-BR')}</dd></div>
        <div><dt className="text-support-gray">Combustível</dt><dd>{vehicle.fuel_type ?? '—'}</dd></div>
        <div><dt className="text-support-gray">Câmbio</dt><dd>{vehicle.transmission ?? '—'}</dd></div>
        <div><dt className="text-support-gray">Cor</dt><dd>{vehicle.color ?? '—'}</dd></div>
      </dl>
      {vehicle.description && <p className="mt-6 max-w-2xl text-support-gray">{vehicle.description}</p>}
      <a
        href={buildWhatsAppUrl(buildVehicleInterestMessage(vehicle))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex rounded bg-aguiar-red px-6 py-3 font-bold uppercase text-white hover:bg-red-700"
      >
        Tenho interesse
      </a>
    </main>
  )
}
```

`site/src/app/estoque/[slug]/not-found.tsx`:
```tsx
import Link from 'next/link'

export default function VehicleNotFound() {
  return (
    <main className="px-6 py-24 text-center">
      <h1 className="text-2xl font-bold uppercase">Veículo não encontrado</h1>
      <p className="mt-4 text-support-gray">Esse veículo já foi vendido ou não existe mais no nosso estoque.</p>
      <Link href="/estoque" className="mt-8 inline-block font-bold uppercase text-aguiar-red hover:underline">
        Ver todo o estoque
      </Link>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/app/estoque/slug-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/app/estoque/\[slug\] site/tests/app/estoque/slug-page.test.tsx
git commit -m "feat(site): add vehicle detail page with 404 handling and plate-safety test"
```

---

### Task 20: Admin authentication (login page + route protection)

**Files:**
- Create: `site/src/lib/auth.ts`, `site/src/middleware.ts`, `site/src/app/admin/login/page.tsx`
- Test: `site/tests/lib/auth.test.ts`, `site/tests/app/admin/login.test.tsx`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient` (Task 3).
- Produces: `isProtectedAdminPath(pathname: string): boolean`, `shouldRedirectToLogin(pathname: string, isAuthenticated: boolean): boolean` (pure, unit-tested — the middleware itself just wires these to the Supabase session and is not separately unit tested, consistent with how untestable Next.js runtime glue is handled elsewhere in this plan); `/admin/login` route. Consumed by Task 21 (admin layout assumes requests already passed the middleware).

- [ ] **Step 1: Write the failing test for the pure auth-guard logic**

`site/tests/lib/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isProtectedAdminPath, shouldRedirectToLogin } from '@/lib/auth'

describe('isProtectedAdminPath', () => {
  it('protects /admin and its subpaths, but not /admin/login', () => {
    expect(isProtectedAdminPath('/admin')).toBe(true)
    expect(isProtectedAdminPath('/admin/veiculos')).toBe(true)
    expect(isProtectedAdminPath('/admin/login')).toBe(false)
    expect(isProtectedAdminPath('/estoque')).toBe(false)
  })

  it('protects the admin-only API routes under /api/admin', () => {
    expect(isProtectedAdminPath('/api/admin/placas')).toBe(true)
  })
})

describe('shouldRedirectToLogin', () => {
  it('redirects unauthenticated requests to protected admin paths', () => {
    expect(shouldRedirectToLogin('/admin/veiculos', false)).toBe(true)
    expect(shouldRedirectToLogin('/admin/veiculos', true)).toBe(false)
    expect(shouldRedirectToLogin('/admin/login', false)).toBe(false)
    expect(shouldRedirectToLogin('/estoque', false)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/auth.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the guard logic and wire it into middleware**

`site/src/lib/auth.ts`:
```ts
export function isProtectedAdminPath(pathname: string): boolean {
  if (pathname.startsWith('/api/admin')) return true
  return pathname.startsWith('/admin') && pathname !== '/admin/login'
}

export function shouldRedirectToLogin(pathname: string, isAuthenticated: boolean): boolean {
  return isProtectedAdminPath(pathname) && !isAuthenticated
}
```

`site/src/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { shouldRedirectToLogin } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (shouldRedirectToLogin(request.nextUrl.pathname, !!user)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] }
```

Note: `/api/admin/placas` (added in Task 23) relies on this matcher for session-cookie protection at the edge; Task 23's route handler adds its own explicit `auth.getUser()` check too, since it also guards a paid external API call and defense in depth is cheap.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the login page**

`site/tests/app/admin/login.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const signInWithPassword = vi.fn(async () => ({ error: null }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ auth: { signInWithPassword } }),
}))

import LoginPage from '@/app/admin/login/page'

describe('/admin/login', () => {
  it('signs in and redirects to /admin on success', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'admin@aguiarveiculos.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'senha-forte' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@aguiarveiculos.com', password: 'senha-forte',
    }))
    expect(push).toHaveBeenCalledWith('/admin')
  })

  it('shows an error message on failed login', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } } as any)
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'admin@aguiarveiculos.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/e-mail ou senha inválidos/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/app/admin/login.test.tsx`
Expected: FAIL — route module doesn't exist.

- [ ] **Step 7: Implement the login page**

`site/src/app/admin/login/page.tsx`:
```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const client = createBrowserSupabaseClient()
    const { error: signInError } = await client.auth.signInWithPassword({
      email: String(formData.get('email')),
      password: String(formData.get('password')),
    })
    if (signInError) {
      setError('E-mail ou senha inválidos.')
      return
    }
    router.push('/admin')
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-24">
      <h1 className="text-2xl font-bold uppercase">Painel Aguiar Veículos</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required className="rounded border p-2 text-graphite" />
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" required className="rounded border p-2 text-graphite" />
        {error && <p className="text-aguiar-red">{error}</p>}
        <Button type="submit">Entrar</Button>
      </form>
    </main>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/app/admin/login.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/auth.ts site/src/middleware.ts site/src/app/admin/login site/tests/lib/auth.test.ts site/tests/app/admin/login.test.tsx
git commit -m "feat(site): add admin auth guard, middleware, and login page"
```

---

### Task 21: Admin layout, nav, and vehicle actions/list

**Files:**
- Modify: `site/src/lib/queries/vehicles.ts` (add `getAllVehiclesAdmin`)
- Create: `site/src/lib/actions/vehicles.ts`, `site/src/app/actions/vehicles.ts`, `site/src/app/admin/layout.tsx`, `site/src/app/admin/page.tsx`, `site/src/components/admin/VehicleTable.tsx`, `site/src/app/admin/veiculos/page.tsx`
- Test: `site/tests/lib/queries/vehicles-admin.test.ts`, `site/tests/lib/actions/vehicles.test.ts`, `site/tests/components/admin/VehicleTable.test.tsx`

**Interfaces:**
- Consumes: `Vehicle` type (Task 3), `VehicleFormValues` (Task 5), `buildVehicleSlug` (Task 4).
- Produces: `getAllVehiclesAdmin(client): Promise<Vehicle[]>`; `saveVehicle(client, input: SaveVehicleInput): Promise<{id: string}>`, `deleteVehicle(client, id)`, `setVehicleFeatured(client, id, isFeatured)`, `setVehicleStatus(client, id, status)`; server actions `adminSaveVehicle`, `adminDeleteVehicle`, `adminSetVehicleFeatured`, `adminSetVehicleStatus` (`'use server'`); `<VehicleTable vehicles={Vehicle[]} />`. Consumed by Task 22 (form uses `adminSaveVehicle`) and Task 23 (form extended with ApiPlacas).

- [ ] **Step 1: Write the failing test for `getAllVehiclesAdmin`**

`site/tests/lib/queries/vehicles-admin.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'

describe('getAllVehiclesAdmin', () => {
  it('queries the vehicles table (not the public view) ordered by created_at', async () => {
    const chain: any = { select: vi.fn(() => chain), order: vi.fn(async () => ({ data: [{ id: '1', plate: 'ABC1D23' }], error: null })) }
    const client = { from: vi.fn(() => chain) }
    const result = await getAllVehiclesAdmin(client as any)
    expect(client.from).toHaveBeenCalledWith('vehicles')
    expect(result).toEqual([{ id: '1', plate: 'ABC1D23' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/queries/vehicles-admin.test.ts`
Expected: FAIL — `getAllVehiclesAdmin` doesn't exist.

- [ ] **Step 3: Add `getAllVehiclesAdmin` to the query layer**

Append to `site/src/lib/queries/vehicles.ts`:
```ts
import type { Vehicle } from '../types'

export async function getAllVehiclesAdmin(client: SupabaseClient): Promise<Vehicle[]> {
  const { data, error } = await client.from('vehicles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Vehicle[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/queries/vehicles-admin.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the admin vehicle actions**

`site/tests/lib/actions/vehicles.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { saveVehicle, deleteVehicle, setVehicleFeatured, setVehicleStatus } from '@/lib/actions/vehicles'

function makeClient(overrides: Partial<Record<string, any>> = {}) {
  const chain: any = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: { id: 'new-id' }, error: null })),
    ...overrides,
  }
  return { from: vi.fn(() => chain), chain }
}

describe('saveVehicle', () => {
  it('inserts a new vehicle and its images when no id is given', async () => {
    const { from, chain } = makeClient()
    const result = await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: ['vehicle-images/a.jpg'],
    })
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(chain.insert).toHaveBeenCalled()
    expect(from).toHaveBeenCalledWith('vehicle_images')
    expect(result).toEqual({ id: 'new-id' })
  })

  it('updates an existing vehicle by id', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      id: 'existing-id', brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    })
    expect(chain.update).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'existing-id')
  })
})

describe('deleteVehicle', () => {
  it('deletes the vehicle by id', async () => {
    const { from, chain } = makeClient()
    await deleteVehicle({ from } as any, 'v-1')
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'v-1')
  })
})

describe('setVehicleFeatured / setVehicleStatus', () => {
  it('updates is_featured', async () => {
    const { from, chain } = makeClient()
    await setVehicleFeatured({ from } as any, 'v-1', true)
    expect(chain.update).toHaveBeenCalledWith({ is_featured: true })
  })

  it('updates status', async () => {
    const { from, chain } = makeClient()
    await setVehicleStatus({ from } as any, 'v-1', 'sold')
    expect(chain.update).toHaveBeenCalledWith({ status: 'sold' })
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/actions/vehicles.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Implement the admin vehicle actions and the server-action wrapper**

`site/src/lib/actions/vehicles.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleStatus } from '../types'
import type { VehicleFormValues } from '../validation'
import { buildVehicleSlug } from '../format'

export interface SaveVehicleInput extends VehicleFormValues {
  id?: string
  imagePaths: string[]
}

export async function saveVehicle(client: SupabaseClient, input: SaveVehicleInput): Promise<{ id: string }> {
  const idFragment = (input.id ?? crypto.randomUUID()).replace(/-/g, '').slice(0, 8)
  const payload = {
    brand: input.brand,
    model: input.model,
    version: input.version ?? null,
    year_model: input.yearModel,
    year_fabrication: input.yearFabrication,
    mileage_km: input.mileageKm,
    price_cents: input.priceCents,
    fuel_type: input.fuelType ?? null,
    transmission: input.transmission ?? null,
    color: input.color ?? null,
    description: input.description ?? null,
    plate: input.plate ?? null,
    slug: buildVehicleSlug(input.brand, input.model, input.yearModel, idFragment),
  }

  let vehicleId = input.id
  if (vehicleId) {
    const { error } = await client.from('vehicles').update(payload).eq('id', vehicleId)
    if (error) throw error
  } else {
    const { data, error } = await client.from('vehicles').insert(payload).select('id').single()
    if (error) throw error
    vehicleId = (data as { id: string }).id
  }

  await client.from('vehicle_images').delete().eq('vehicle_id', vehicleId)
  if (input.imagePaths.length > 0) {
    const rows = input.imagePaths.map((storage_path, display_order) => ({ vehicle_id: vehicleId, storage_path, display_order }))
    const { error } = await client.from('vehicle_images').insert(rows)
    if (error) throw error
  }

  return { id: vehicleId! }
}

export async function deleteVehicle(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

export async function setVehicleFeatured(client: SupabaseClient, id: string, isFeatured: boolean): Promise<void> {
  const { error } = await client.from('vehicles').update({ is_featured: isFeatured }).eq('id', id)
  if (error) throw error
}

export async function setVehicleStatus(client: SupabaseClient, id: string, status: VehicleStatus): Promise<void> {
  const { error } = await client.from('vehicles').update({ status }).eq('id', id)
  if (error) throw error
}
```

`site/src/app/actions/vehicles.ts`:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import * as vehicleActions from '@/lib/actions/vehicles'
import type { SaveVehicleInput } from '@/lib/actions/vehicles'
import type { VehicleStatus } from '@/lib/types'

export async function adminSaveVehicle(input: SaveVehicleInput) {
  const client = await createServerSupabaseClient()
  const result = await vehicleActions.saveVehicle(client, input)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
  revalidatePath('/')
  return result
}

export async function adminDeleteVehicle(id: string) {
  const client = await createServerSupabaseClient()
  await vehicleActions.deleteVehicle(client, id)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
}

export async function adminSetVehicleFeatured(id: string, isFeatured: boolean) {
  const client = await createServerSupabaseClient()
  await vehicleActions.setVehicleFeatured(client, id, isFeatured)
  revalidatePath('/admin/veiculos')
  revalidatePath('/')
}

export async function adminSetVehicleStatus(id: string, status: VehicleStatus) {
  const client = await createServerSupabaseClient()
  await vehicleActions.setVehicleStatus(client, id, status)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/actions/vehicles.test.ts`
Expected: PASS

- [ ] **Step 9: Write the failing test for the vehicle table**

`site/tests/components/admin/VehicleTable.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const adminDeleteVehicle = vi.fn()
const adminSetVehicleFeatured = vi.fn()
vi.mock('@/app/actions/vehicles', () => ({ adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus: vi.fn() }))
vi.spyOn(window, 'confirm').mockReturnValue(true)

import { VehicleTable } from '@/components/admin/VehicleTable'

const vehicles = [
  { id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive', year_model: 2023, price_cents: 6490000, is_featured: false, status: 'available', plate: 'DEF4G56' },
] as any

describe('VehicleTable', () => {
  it('lists vehicles and deletes on confirm', () => {
    render(<VehicleTable vehicles={vehicles} />)
    expect(screen.getByText(/fiat argo/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(adminDeleteVehicle).toHaveBeenCalledWith('1')
  })

  it('toggles destaque', () => {
    render(<VehicleTable vehicles={vehicles} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar como destaque/i }))
    expect(adminSetVehicleFeatured).toHaveBeenCalledWith('1', true)
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleTable.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 11: Implement the admin layout, dashboard redirect, table, and list page**

`site/src/app/admin/layout.tsx`:
```tsx
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-graphite text-white">
      <nav className="flex gap-6 border-b border-support-gray px-6 py-4">
        <Link href="/admin/veiculos" className="font-bold uppercase hover:text-aguiar-red">Veículos</Link>
        <Link href="/admin/depoimentos" className="font-bold uppercase hover:text-aguiar-red">Depoimentos</Link>
        <Link href="/admin/leads" className="font-bold uppercase hover:text-aguiar-red">Leads</Link>
        <Link href="/admin/configuracoes" className="font-bold uppercase hover:text-aguiar-red">Configurações</Link>
      </nav>
      <div className="px-6 py-8">{children}</div>
    </div>
  )
}
```

`site/src/app/admin/page.tsx`:
```tsx
import { redirect } from 'next/navigation'

export default function AdminHome() {
  redirect('/admin/veiculos')
}
```

`site/src/components/admin/VehicleTable.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { formatPriceFromCents } from '@/lib/format'
import type { Vehicle } from '@/lib/types'
import { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } from '@/app/actions/vehicles'

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-support-gray">
          <th className="py-2">Veículo</th>
          <th>Preço</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <tr key={vehicle.id} className="border-b border-support-gray/40">
            <td className="py-2">{vehicle.brand} {vehicle.model} {vehicle.version}</td>
            <td>{formatPriceFromCents(vehicle.price_cents)}</td>
            <td>{vehicle.status === 'sold' ? 'Vendido' : 'Disponível'}{vehicle.is_featured ? ' · Destaque' : ''}</td>
            <td className="flex gap-2 py-2">
              <Link href={`/admin/veiculos/${vehicle.id}`} className="text-aguiar-red hover:underline">Editar</Link>
              <button onClick={() => adminSetVehicleFeatured(vehicle.id, !vehicle.is_featured)}>
                {vehicle.is_featured ? 'Remover destaque' : 'Marcar como destaque'}
              </button>
              <button onClick={() => adminSetVehicleStatus(vehicle.id, vehicle.status === 'sold' ? 'available' : 'sold')}>
                {vehicle.status === 'sold' ? 'Marcar como disponível' : 'Marcar como vendido'}
              </button>
              <button
                onClick={() => { if (window.confirm('Excluir este veículo?')) adminDeleteVehicle(vehicle.id) }}
                className="text-aguiar-red"
              >
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

`site/src/app/admin/veiculos/page.tsx`:
```tsx
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { VehicleTable } from '@/components/admin/VehicleTable'

export default async function AdminVeiculosPage() {
  const client = await createServerSupabaseClient()
  const vehicles = await getAllVehiclesAdmin(client)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase">Veículos</h1>
        <Link href="/admin/veiculos/novo" className="rounded bg-aguiar-red px-4 py-2 font-bold uppercase text-white">
          Novo veículo
        </Link>
      </div>
      <VehicleTable vehicles={vehicles} />
    </div>
  )
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/admin/VehicleTable.test.tsx`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/queries/vehicles.ts site/src/lib/actions/vehicles.ts site/src/app/actions/vehicles.ts site/src/app/admin/layout.tsx site/src/app/admin/page.tsx site/src/components/admin/VehicleTable.tsx site/src/app/admin/veiculos/page.tsx site/tests/lib/queries/vehicles-admin.test.ts site/tests/lib/actions/vehicles.test.ts site/tests/components/admin/VehicleTable.test.tsx
git commit -m "feat(site): add admin layout, vehicle actions, and vehicle list"
```

---

### Task 22: Vehicle create/edit form with photo upload and reordering

**Files:**
- Create: `site/src/lib/storage.ts`, `site/src/lib/queries/vehicle-images.ts`
- Modify: `site/src/lib/queries/vehicles.ts` (add `getVehicleByIdAdmin`)
- Create: `site/src/components/admin/VehicleForm.tsx`, `site/src/app/admin/veiculos/novo/page.tsx`, `site/src/app/admin/veiculos/[id]/page.tsx`
- Test: `site/tests/lib/storage.test.ts`, `site/tests/components/admin/VehicleForm.test.tsx`

**Interfaces:**
- Consumes: `vehicleFormSchema` (Task 5), `adminSaveVehicle` (Task 21).
- Produces: `uploadVehicleImage(client, file): Promise<string>`, `getVehicleImages(client, vehicleId): Promise<VehicleImage[]>`, `getVehicleByIdAdmin(client, id): Promise<Vehicle | null>`, `<VehicleForm vehicle? images? />`. Consumed by Task 23 (adds the "Buscar por placa" button to this same form).

- [ ] **Step 1: Write the failing test for storage upload**

`site/tests/lib/storage.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { uploadVehicleImage } from '@/lib/storage'

describe('uploadVehicleImage', () => {
  it('uploads to the vehicle-images bucket and returns the storage path', async () => {
    const upload = vi.fn(async () => ({ error: null }))
    const client = { storage: { from: vi.fn(() => ({ upload })) } }
    const file = new File(['x'], 'polo.jpg', { type: 'image/jpeg' })
    const path = await uploadVehicleImage(client as any, file)
    expect(client.storage.from).toHaveBeenCalledWith('vehicle-images')
    expect(path).toContain('polo.jpg')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/storage.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement storage helper and the remaining query functions**

`site/src/lib/storage.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function uploadVehicleImage(client: SupabaseClient, file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await client.storage.from('vehicle-images').upload(path, file)
  if (error) throw error
  return path
}

export function getPublicImageUrl(client: SupabaseClient, bucket: string, path: string): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
```

`site/src/lib/queries/vehicle-images.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleImage } from '../types'

export async function getVehicleImages(client: SupabaseClient, vehicleId: string): Promise<VehicleImage[]> {
  const { data, error } = await client
    .from('vehicle_images')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data as VehicleImage[]
}
```

Append to `site/src/lib/queries/vehicles.ts`:
```ts
export async function getVehicleByIdAdmin(client: SupabaseClient, id: string): Promise<Vehicle | null> {
  const { data, error } = await client.from('vehicles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Vehicle) ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the form**

`site/tests/components/admin/VehicleForm.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const adminSaveVehicle = vi.fn(async () => ({ id: 'v-1' }))
vi.mock('@/app/actions/vehicles', () => ({ adminSaveVehicle }))

const upload = vi.fn(async () => ({ error: null }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload }) } }),
}))

import { VehicleForm } from '@/components/admin/VehicleForm'

describe('VehicleForm', () => {
  it('uploads a photo, fills required fields, and saves the vehicle', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })

    const file = new File(['x'], 'argo.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/fotos/i), { target: { files: [file] } })
    await waitFor(() => expect(upload).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /salvar veículo/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ brand: 'Fiat', model: 'Argo', priceCents: 6490000, imagePaths: expect.arrayContaining([expect.stringContaining('argo.jpg')]) }),
    ))
    expect(push).toHaveBeenCalledWith('/admin/veiculos')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleForm.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Implement the form and the two pages that host it**

`site/src/components/admin/VehicleForm.tsx`:
```tsx
'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadVehicleImage } from '@/lib/storage'
import { adminSaveVehicle } from '@/app/actions/vehicles'
import type { Vehicle, VehicleImage } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface VehicleFormProps {
  vehicle?: Vehicle
  images?: VehicleImage[]
}

export function VehicleForm({ vehicle, images = [] }: VehicleFormProps) {
  const router = useRouter()
  const [imagePaths, setImagePaths] = useState<string[]>(images.map((image) => image.storage_path))
  const [error, setError] = useState<string | null>(null)

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const client = createBrowserSupabaseClient()
    const uploaded = await Promise.all(files.map((file) => uploadVehicleImage(client, file)))
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await adminSaveVehicle({
        id: vehicle?.id,
        brand: String(formData.get('brand')),
        model: String(formData.get('model')),
        version: String(formData.get('version') || ''),
        yearModel: Number(formData.get('yearModel')),
        yearFabrication: Number(formData.get('yearFabrication')),
        mileageKm: Number(formData.get('mileageKm')),
        priceCents: Math.round(Number(formData.get('priceReais')) * 100),
        fuelType: String(formData.get('fuelType') || ''),
        transmission: String(formData.get('transmission') || ''),
        color: String(formData.get('color') || ''),
        description: String(formData.get('description') || ''),
        plate: String(formData.get('plate') || ''),
        imagePaths,
      })
      router.push('/admin/veiculos')
    } catch {
      setError('Não foi possível salvar o veículo. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-3">
      <label htmlFor="brand">Marca</label>
      <input id="brand" name="brand" defaultValue={vehicle?.brand} required className="rounded border p-2 text-graphite" />
      <label htmlFor="model">Modelo</label>
      <input id="model" name="model" defaultValue={vehicle?.model} required className="rounded border p-2 text-graphite" />
      <label htmlFor="version">Versão</label>
      <input id="version" name="version" defaultValue={vehicle?.version ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="yearModel">Ano do modelo</label>
      <input id="yearModel" name="yearModel" type="number" defaultValue={vehicle?.year_model} required className="rounded border p-2 text-graphite" />
      <label htmlFor="yearFabrication">Ano de fabricação</label>
      <input id="yearFabrication" name="yearFabrication" type="number" defaultValue={vehicle?.year_fabrication} required className="rounded border p-2 text-graphite" />
      <label htmlFor="mileageKm">Quilometragem</label>
      <input id="mileageKm" name="mileageKm" type="number" defaultValue={vehicle?.mileage_km} required className="rounded border p-2 text-graphite" />
      <label htmlFor="priceReais">Preço (em reais)</label>
      <input id="priceReais" name="priceReais" type="number" defaultValue={vehicle ? vehicle.price_cents / 100 : ''} required className="rounded border p-2 text-graphite" />
      <label htmlFor="fuelType">Combustível</label>
      <input id="fuelType" name="fuelType" defaultValue={vehicle?.fuel_type ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="transmission">Câmbio</label>
      <input id="transmission" name="transmission" defaultValue={vehicle?.transmission ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="color">Cor</label>
      <input id="color" name="color" defaultValue={vehicle?.color ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="description">Descrição</label>
      <textarea id="description" name="description" defaultValue={vehicle?.description ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="plate">Placa (uso interno, nunca aparece no site)</label>
      <input id="plate" name="plate" defaultValue={vehicle?.plate ?? ''} className="rounded border p-2 text-graphite" />

      <label htmlFor="images">Fotos</label>
      <input id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFilesSelected} />
      <ul className="flex flex-col gap-1">
        {imagePaths.map((path, index) => (
          <li key={path} className="flex items-center gap-2 text-sm">
            {path}
            <button type="button" onClick={() => moveImage(index, -1)}>↑</button>
            <button type="button" onClick={() => moveImage(index, 1)}>↓</button>
          </li>
        ))}
      </ul>

      {error && <p className="text-aguiar-red">{error}</p>}
      <Button type="submit">Salvar veículo</Button>
    </form>
  )
}
```

`site/src/app/admin/veiculos/novo/page.tsx`:
```tsx
import { VehicleForm } from '@/components/admin/VehicleForm'

export default function NewVehiclePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Novo veículo</h1>
      <VehicleForm />
    </div>
  )
}
```

`site/src/app/admin/veiculos/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleByIdAdmin } from '@/lib/queries/vehicles'
import { getVehicleImages } from '@/lib/queries/vehicle-images'
import { VehicleForm } from '@/components/admin/VehicleForm'

interface EditVehiclePageProps {
  params: Promise<{ id: string }>
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleByIdAdmin(client, id)
  if (!vehicle) notFound()
  const images = await getVehicleImages(client, id)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Editar veículo</h1>
      <VehicleForm vehicle={vehicle} images={images} />
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/admin/VehicleForm.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/storage.ts site/src/lib/queries/vehicle-images.ts site/src/lib/queries/vehicles.ts site/src/components/admin/VehicleForm.tsx site/src/app/admin/veiculos/novo site/src/app/admin/veiculos/\[id\] site/tests/lib/storage.test.ts site/tests/components/admin/VehicleForm.test.tsx
git commit -m "feat(site): add vehicle create/edit form with photo upload and reordering"
```

---

### Task 23: ApiPlacas plate lookup (admin only)

**Files:**
- Create: `site/src/lib/apiplacas.ts`, `site/src/app/api/admin/placas/route.ts`
- Modify: `site/src/components/admin/VehicleForm.tsx` (add the "Buscar por placa" button)
- Test: `site/tests/lib/apiplacas.test.ts`, `site/tests/app/api/admin/placas.test.ts`, `site/tests/components/admin/VehicleForm.test.tsx` (extend)

**Interfaces:**
- Consumes: `APIPLACAS_API_KEY` env var (Task 2), auth check via `createServerSupabaseClient` (Task 3).
- Produces: `fetchVehicleDataByPlate(plate: string): Promise<ApiPlacasResult>`, `class ApiPlacasError`; the `/api/admin/placas?plate=...` GET route (auth-protected, key never leaves the server). Consumed only by `VehicleForm`'s "Buscar por placa" button.

**Important — confirm before deploying:** the exact request URL and JSON field names below follow ApiPlacas's documented plate-lookup pattern, but must be checked against the account's actual dashboard/API docs (this is the spec's open item 7 — the key is already owned by the user, not yet shared). The entire external contract is isolated in `fetchVehicleDataByPlate`, so if the real endpoint or field names differ, this is a one-function change; nothing else in the app needs to know.

- [ ] **Step 1: Write the failing test for the adapter**

`site/tests/lib/apiplacas.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchVehicleDataByPlate, ApiPlacasError } from '@/lib/apiplacas'

const originalFetch = global.fetch

beforeEach(() => {
  process.env.APIPLACAS_API_KEY = 'test-key'
})

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('fetchVehicleDataByPlate', () => {
  it('maps a successful ApiPlacas response to ApiPlacasResult', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      MARCA: 'FIAT', MODELO: 'ARGO', ano: '2023', anoModelo: '2023', cor: 'PRATA', combustivel: 'FLEX',
    }), { status: 200 })) as any

    const result = await fetchVehicleDataByPlate('DEF4G56')
    expect(result).toEqual({
      brand: 'FIAT', model: 'ARGO', yearFabrication: 2023, yearModel: 2023, color: 'PRATA', fuelType: 'FLEX',
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('DEF4G56'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-key' }) }),
    )
  })

  it('throws ApiPlacasError when the external API returns an error status', async () => {
    global.fetch = vi.fn(async () => new Response('erro', { status: 404 })) as any
    await expect(fetchVehicleDataByPlate('ZZZ0000')).rejects.toThrow(ApiPlacasError)
  })

  it('throws ApiPlacasError when the API key is missing', async () => {
    delete process.env.APIPLACAS_API_KEY
    await expect(fetchVehicleDataByPlate('DEF4G56')).rejects.toThrow(ApiPlacasError)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/apiplacas.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the adapter**

`site/src/lib/apiplacas.ts`:
```ts
export interface ApiPlacasResult {
  brand: string
  model: string
  yearFabrication?: number
  yearModel?: number
  color?: string
  fuelType?: string
}

export class ApiPlacasError extends Error {}

interface ApiPlacasRawResponse {
  MARCA?: string
  MODELO?: string
  ano?: string
  anoModelo?: string
  cor?: string
  combustivel?: string
}

export async function fetchVehicleDataByPlate(plate: string): Promise<ApiPlacasResult> {
  const apiKey = process.env.APIPLACAS_API_KEY
  if (!apiKey) throw new ApiPlacasError('APIPLACAS_API_KEY não configurada.')

  const response = await fetch(`https://apiplacas.com.br/consulta/${encodeURIComponent(plate)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) throw new ApiPlacasError(`ApiPlacas retornou status ${response.status}`)

  const data = (await response.json()) as ApiPlacasRawResponse
  if (!data.MARCA || !data.MODELO) throw new ApiPlacasError('Resposta da ApiPlacas sem marca/modelo.')

  return {
    brand: data.MARCA,
    model: data.MODELO,
    yearFabrication: data.ano ? Number(data.ano) : undefined,
    yearModel: data.anoModelo ? Number(data.anoModelo) : undefined,
    color: data.cor,
    fuelType: data.combustivel,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/apiplacas.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the API route**

`site/tests/app/api/admin/placas.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser } })),
}))

const fetchVehicleDataByPlate = vi.fn()
vi.mock('@/lib/apiplacas', () => ({
  fetchVehicleDataByPlate,
  ApiPlacasError: class ApiPlacasError extends Error {},
}))

import { GET } from '@/app/api/admin/placas/route'

beforeEach(() => {
  getUser.mockReset()
  fetchVehicleDataByPlate.mockReset()
})

describe('GET /api/admin/placas', () => {
  it('returns 401 when there is no authenticated admin session', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } })
    const response = await GET(new Request('http://localhost/api/admin/placas?plate=DEF4G56'))
    expect(response.status).toBe(401)
  })

  it('returns the vehicle data for an authenticated request', async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
    fetchVehicleDataByPlate.mockResolvedValueOnce({ brand: 'Fiat', model: 'Argo' })
    const response = await GET(new Request('http://localhost/api/admin/placas?plate=DEF4G56'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ brand: 'Fiat', model: 'Argo' })
  })

  it('returns 502 with a friendly message when ApiPlacas fails, never blocking manual entry', async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
    fetchVehicleDataByPlate.mockRejectedValueOnce(new Error('boom'))
    const response = await GET(new Request('http://localhost/api/admin/placas?plate=ZZZ0000'))
    expect(response.status).toBe(502)
    expect((await response.json()).error).toMatch(/não foi possível buscar/i)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/app/api/admin/placas.test.ts`
Expected: FAIL — route doesn't exist.

- [ ] **Step 7: Implement the route**

`site/src/app/api/admin/placas/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchVehicleDataByPlate } from '@/lib/apiplacas'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const plate = new URL(request.url).searchParams.get('plate')
  if (!plate) return NextResponse.json({ error: 'Informe a placa.' }, { status: 400 })

  try {
    const result = await fetchVehicleDataByPlate(plate)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar os dados da placa. Preencha manualmente.' }, { status: 502 })
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/app/api/admin/placas.test.ts`
Expected: PASS

- [ ] **Step 9: Write the failing test extending VehicleForm with the lookup button**

Append to `site/tests/components/admin/VehicleForm.test.tsx`:
```tsx
describe('VehicleForm — buscar por placa', () => {
  it('prefills brand/model/color/fuel from a successful plate lookup', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      brand: 'Fiat', model: 'Argo', color: 'Prata', fuelType: 'Flex',
    }), { status: 200 })) as any

    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/placa/i), { target: { value: 'DEF4G56' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar dados/i }))

    expect(await screen.findByDisplayValue('Fiat')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Argo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Prata')).toBeInTheDocument()
  })

  it('shows a warning and keeps the form editable when the lookup fails', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'Não foi possível buscar os dados da placa. Preencha manualmente.' }), { status: 502 })) as any

    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/placa/i), { target: { value: 'ZZZ0000' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar dados/i }))

    expect(await screen.findByText(/não foi possível buscar/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/marca/i)).not.toBeDisabled()
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/admin/VehicleForm.test.tsx`
Expected: FAIL — no "Buscar dados" button yet.

- [ ] **Step 11: Add the lookup button to `VehicleForm`**

Modify `site/src/components/admin/VehicleForm.tsx`: convert `brand`, `model`, `color`, `fuelType` to controlled inputs (state, since the lookup needs to overwrite them) and add a lookup handler and button next to the `plate` field.

```tsx
// add to the top-level state alongside imagePaths/error:
const [brand, setBrand] = useState(vehicle?.brand ?? '')
const [model, setModel] = useState(vehicle?.model ?? '')
const [color, setColor] = useState(vehicle?.color ?? '')
const [fuelType, setFuelType] = useState(vehicle?.fuel_type ?? '')
const [plate, setPlate] = useState(vehicle?.plate ?? '')
const [plateLookupError, setPlateLookupError] = useState<string | null>(null)

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
  if (data.fuelType) setFuelType(data.fuelType)
}
```

Replace the `brand`, `model`, `color`, `fuelType` inputs with controlled versions (`value={brand} onChange={(e) => setBrand(e.target.value)}`, and likewise for the others), replace the `plate` input with `value={plate} onChange={(e) => setPlate(e.target.value)}`, add a "Buscar dados" button right after it, and render `plateLookupError` beneath it:

```tsx
<label htmlFor="plate">Placa (uso interno, nunca aparece no site)</label>
<div className="flex gap-2">
  <input id="plate" name="plate" value={plate} onChange={(e) => setPlate(e.target.value)} className="rounded border p-2 text-graphite" />
  <button type="button" onClick={handlePlateLookup} className="rounded border px-3 py-2 font-bold uppercase">
    Buscar dados
  </button>
</div>
{plateLookupError && <p className="text-aguiar-red">{plateLookupError}</p>}
```

Finally, read `formData.get('brand')`-style calls in `handleSubmit` for these four fields directly from state instead of `FormData` (`brand`, `model`, `color`, `fuelType`, `plate`), since they are now controlled.

- [ ] **Step 12: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/admin/VehicleForm.test.tsx`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/apiplacas.ts site/src/app/api/admin/placas site/src/components/admin/VehicleForm.tsx site/src/middleware.ts site/src/lib/auth.ts site/tests/lib/apiplacas.test.ts site/tests/app/api/admin/placas.test.ts site/tests/components/admin/VehicleForm.test.tsx site/tests/lib/auth.test.ts
git commit -m "feat(site): add ApiPlacas plate lookup, server-only key, admin-only route"
```

---

### Task 24: Admin depoimentos CRUD

**Files:**
- Create: `site/src/lib/actions/testimonials.ts`, `site/src/app/actions/testimonials.ts`, `site/src/components/admin/TestimonialForm.tsx`, `site/src/components/admin/TestimonialTable.tsx`, `site/src/app/admin/depoimentos/page.tsx`
- Modify: `site/src/lib/queries/testimonials.ts` (add `getAllTestimonialsAdmin`)
- Test: `site/tests/lib/actions/testimonials.test.ts`, `site/tests/components/admin/TestimonialForm.test.tsx`

**Interfaces:**
- Consumes: `Testimonial` type (Task 3), `uploadVehicleImage` pattern from Task 22 (generalized here to a `testimonial-images` bucket).
- Produces: `getAllTestimonialsAdmin(client): Promise<Testimonial[]>`; `saveTestimonial(client, input)`, `deleteTestimonial(client, id)`, `setTestimonialPublished(client, id, isPublished)`; server actions `adminSaveTestimonial`, `adminDeleteTestimonial`, `adminSetTestimonialPublished`; `<TestimonialForm />`, `<TestimonialTable testimonials={Testimonial[]} />`.

- [ ] **Step 1: Write the failing test for the testimonial actions**

`site/tests/lib/actions/testimonials.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { saveTestimonial, deleteTestimonial, setTestimonialPublished } from '@/lib/actions/testimonials'

function makeClient() {
  const chain: any = {
    insert: vi.fn(() => chain), update: vi.fn(() => chain), delete: vi.fn(() => chain),
    select: vi.fn(() => chain), eq: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: { id: 't-1' }, error: null })),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('saveTestimonial', () => {
  it('inserts a new testimonial when no id is given', async () => {
    const { from, chain } = makeClient()
    const result = await saveTestimonial({ from } as any, { imageUrl: 'https://x/1.jpg', caption: 'Ótimo!', displayOrder: 1 })
    expect(from).toHaveBeenCalledWith('testimonials')
    expect(chain.insert).toHaveBeenCalled()
    expect(result).toEqual({ id: 't-1' })
  })

  it('updates an existing testimonial by id', async () => {
    const { from, chain } = makeClient()
    await saveTestimonial({ from } as any, { id: 't-1', imageUrl: 'https://x/1.jpg', caption: 'Ótimo!', displayOrder: 1 })
    expect(chain.update).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 't-1')
  })
})

describe('deleteTestimonial / setTestimonialPublished', () => {
  it('deletes by id', async () => {
    const { from, chain } = makeClient()
    await deleteTestimonial({ from } as any, 't-1')
    expect(chain.delete).toHaveBeenCalled()
  })

  it('toggles is_published', async () => {
    const { from, chain } = makeClient()
    await setTestimonialPublished({ from } as any, 't-1', false)
    expect(chain.update).toHaveBeenCalledWith({ is_published: false })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/actions/testimonials.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the testimonial actions, query, and server-action wrapper**

Append to `site/src/lib/queries/testimonials.ts`:
```ts
import type { Testimonial } from '../types'

export async function getAllTestimonialsAdmin(client: SupabaseClient): Promise<Testimonial[]> {
  const { data, error } = await client.from('testimonials').select('*').order('display_order', { ascending: true })
  if (error) throw error
  return data as Testimonial[]
}
```

`site/src/lib/actions/testimonials.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SaveTestimonialInput {
  id?: string
  imageUrl: string
  caption: string
  displayOrder: number
}

export async function saveTestimonial(client: SupabaseClient, input: SaveTestimonialInput): Promise<{ id: string }> {
  const payload = { image_url: input.imageUrl, caption: input.caption, display_order: input.displayOrder }
  if (input.id) {
    const { error } = await client.from('testimonials').update(payload).eq('id', input.id)
    if (error) throw error
    return { id: input.id }
  }
  const { data, error } = await client.from('testimonials').insert(payload).select('id').single()
  if (error) throw error
  return data as { id: string }
}

export async function deleteTestimonial(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('testimonials').delete().eq('id', id)
  if (error) throw error
}

export async function setTestimonialPublished(client: SupabaseClient, id: string, isPublished: boolean): Promise<void> {
  const { error } = await client.from('testimonials').update({ is_published: isPublished }).eq('id', id)
  if (error) throw error
}
```

`site/src/app/actions/testimonials.ts`:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import * as testimonialActions from '@/lib/actions/testimonials'
import type { SaveTestimonialInput } from '@/lib/actions/testimonials'

export async function adminSaveTestimonial(input: SaveTestimonialInput) {
  const client = await createServerSupabaseClient()
  const result = await testimonialActions.saveTestimonial(client, input)
  revalidatePath('/admin/depoimentos')
  revalidatePath('/')
  return result
}

export async function adminDeleteTestimonial(id: string) {
  const client = await createServerSupabaseClient()
  await testimonialActions.deleteTestimonial(client, id)
  revalidatePath('/admin/depoimentos')
  revalidatePath('/')
}

export async function adminSetTestimonialPublished(id: string, isPublished: boolean) {
  const client = await createServerSupabaseClient()
  await testimonialActions.setTestimonialPublished(client, id, isPublished)
  revalidatePath('/admin/depoimentos')
  revalidatePath('/')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/actions/testimonials.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the testimonial form**

`site/tests/components/admin/TestimonialForm.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
const adminSaveTestimonial = vi.fn(async () => ({ id: 't-1' }))
vi.mock('@/app/actions/testimonials', () => ({ adminSaveTestimonial }))
const upload = vi.fn(async () => ({ error: null }))
const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://x/1.jpg' } }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload, getPublicUrl }) } }),
}))

import { TestimonialForm } from '@/components/admin/TestimonialForm'

describe('TestimonialForm', () => {
  it('uploads an image, fills the caption, and saves', async () => {
    render(<TestimonialForm />)
    const file = new File(['x'], 'cliente.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/imagem/i), { target: { files: [file] } })
    await waitFor(() => expect(upload).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/legenda/i), { target: { value: 'Mais um sonho realizado! 🙏' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar depoimento/i }))

    await waitFor(() => expect(adminSaveTestimonial).toHaveBeenCalledWith(
      expect.objectContaining({ caption: 'Mais um sonho realizado! 🙏', imageUrl: 'https://x/1.jpg' }),
    ))
    expect(push).toHaveBeenCalledWith('/admin/depoimentos')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/admin/TestimonialForm.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Implement the form, table, and page**

`site/src/components/admin/TestimonialForm.tsx`:
```tsx
'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { adminSaveTestimonial } from '@/app/actions/testimonials'
import type { Testimonial } from '@/lib/types'
import { Button } from '@/components/ui/Button'

export function TestimonialForm({ testimonial }: { testimonial?: Testimonial }) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState(testimonial?.image_url ?? '')

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const client = createBrowserSupabaseClient()
    const path = `${crypto.randomUUID()}-${file.name}`
    const { error } = await client.storage.from('testimonial-images').upload(path, file)
    if (error) return
    const { data } = client.storage.from('testimonial-images').getPublicUrl(path)
    setImageUrl(data.publicUrl)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSaveTestimonial({
      id: testimonial?.id,
      imageUrl,
      caption: String(formData.get('caption')),
      displayOrder: Number(formData.get('displayOrder') || 0),
    })
    router.push('/admin/depoimentos')
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3">
      <label htmlFor="testimonial-image">Imagem</label>
      <input id="testimonial-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelected} />
      <label htmlFor="caption">Legenda</label>
      <textarea id="caption" name="caption" defaultValue={testimonial?.caption} required className="rounded border p-2 text-graphite" />
      <label htmlFor="displayOrder">Ordem</label>
      <input id="displayOrder" name="displayOrder" type="number" defaultValue={testimonial?.display_order ?? 0} className="rounded border p-2 text-graphite" />
      <Button type="submit">Salvar depoimento</Button>
    </form>
  )
}
```

`site/src/components/admin/TestimonialTable.tsx`:
```tsx
'use client'

import { adminDeleteTestimonial, adminSetTestimonialPublished } from '@/app/actions/testimonials'
import type { Testimonial } from '@/lib/types'

export function TestimonialTable({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {testimonials.map((testimonial) => (
        <li key={testimonial.id} className="flex items-center justify-between gap-4 border-b border-support-gray/40 pb-2">
          <span>{testimonial.caption}</span>
          <div className="flex gap-2">
            <button onClick={() => adminSetTestimonialPublished(testimonial.id, !testimonial.is_published)}>
              {testimonial.is_published ? 'Despublicar' : 'Publicar'}
            </button>
            <button
              onClick={() => { if (window.confirm('Excluir este depoimento?')) adminDeleteTestimonial(testimonial.id) }}
              className="text-aguiar-red"
            >
              Excluir
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

`site/src/app/admin/depoimentos/page.tsx`:
```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllTestimonialsAdmin } from '@/lib/queries/testimonials'
import { TestimonialForm } from '@/components/admin/TestimonialForm'
import { TestimonialTable } from '@/components/admin/TestimonialTable'

export default async function AdminDepoimentosPage() {
  const client = await createServerSupabaseClient()
  const testimonials = await getAllTestimonialsAdmin(client)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold uppercase">Depoimentos</h1>
      <TestimonialForm />
      <TestimonialTable testimonials={testimonials} />
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/admin/TestimonialForm.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/queries/testimonials.ts site/src/lib/actions/testimonials.ts site/src/app/actions/testimonials.ts site/src/components/admin/TestimonialForm.tsx site/src/components/admin/TestimonialTable.tsx site/src/app/admin/depoimentos site/tests/lib/actions/testimonials.test.ts site/tests/components/admin/TestimonialForm.test.tsx
git commit -m "feat(site): add admin depoimentos CRUD (upload, publish toggle, delete)"
```

---

### Task 25: Admin leads list

**Files:**
- Create: `site/src/lib/queries/leads.ts`, `site/src/components/admin/LeadTable.tsx`, `site/src/app/admin/leads/page.tsx`
- Test: `site/tests/lib/queries/leads.test.ts`, `site/tests/components/admin/LeadTable.test.tsx`

**Interfaces:**
- Consumes: `Lead` type (Task 3).
- Produces: `getAllLeadsAdmin(client): Promise<Lead[]>`; `<LeadTable leads={Lead[]} />`.

- [ ] **Step 1: Write the failing test for the query**

`site/tests/lib/queries/leads.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { getAllLeadsAdmin } from '@/lib/queries/leads'

describe('getAllLeadsAdmin', () => {
  it('queries leads ordered by most recent first', async () => {
    const chain: any = { select: vi.fn(() => chain), order: vi.fn(async () => ({ data: [{ id: 'l-1', type: 'financing' }], error: null })) }
    const client = { from: vi.fn(() => chain) }
    const result = await getAllLeadsAdmin(client as any)
    expect(client.from).toHaveBeenCalledWith('leads')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([{ id: 'l-1', type: 'financing' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/queries/leads.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the query**

`site/src/lib/queries/leads.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from '../types'

export async function getAllLeadsAdmin(client: SupabaseClient): Promise<Lead[]> {
  const { data, error } = await client.from('leads').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Lead[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/queries/leads.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the table**

`site/tests/components/admin/LeadTable.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { LeadTable } from '@/components/admin/LeadTable'

const leads = [
  { id: 'l-1', type: 'financing', name: 'Maria', phone: '98999999999', details: { downPayment: '5000' }, vehicle_id: null, created_at: '2026-08-28T10:00:00Z' },
  { id: 'l-2', type: 'trade_in', name: 'João', phone: '98988888888', details: { brand: 'Chevrolet', model: 'Onix' }, vehicle_id: null, created_at: '2026-08-27T10:00:00Z' },
] as any

describe('LeadTable', () => {
  it('lists leads with name, phone, and type label', () => {
    render(<LeadTable leads={leads} />)
    expect(screen.getByText('Maria')).toBeInTheDocument()
    expect(screen.getByText(/financiamento/i)).toBeInTheDocument()
    expect(screen.getByText('João')).toBeInTheDocument()
    expect(screen.getByText(/avaliação de usado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/admin/LeadTable.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Implement the table and page**

`site/src/components/admin/LeadTable.tsx`:
```tsx
import type { Lead } from '@/lib/types'

const TYPE_LABEL: Record<Lead['type'], string> = {
  financing: 'Financiamento',
  trade_in: 'Avaliação de usado',
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-support-gray">
          <th className="py-2">Nome</th>
          <th>Telefone</th>
          <th>Tipo</th>
          <th>Detalhes</th>
          <th>Recebido em</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr key={lead.id} className="border-b border-support-gray/40">
            <td className="py-2">{lead.name}</td>
            <td>{lead.phone}</td>
            <td>{TYPE_LABEL[lead.type]}</td>
            <td>{lead.details ? JSON.stringify(lead.details) : '—'}</td>
            <td>{new Date(lead.created_at).toLocaleString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

`site/src/app/admin/leads/page.tsx`:
```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { LeadTable } from '@/components/admin/LeadTable'

export default async function AdminLeadsPage() {
  const client = await createServerSupabaseClient()
  const leads = await getAllLeadsAdmin(client)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Leads</h1>
      {leads.length === 0 ? <p className="text-support-gray">Nenhum lead recebido ainda.</p> : <LeadTable leads={leads} />}
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/admin/LeadTable.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/queries/leads.ts site/src/components/admin/LeadTable.tsx site/src/app/admin/leads site/tests/lib/queries/leads.test.ts site/tests/components/admin/LeadTable.test.tsx
git commit -m "feat(site): add admin leads list (financing and trade-in submissions)"
```

---

### Task 26: Admin configurações (location video)

**Files:**
- Create: `site/src/lib/actions/site-settings.ts`, `site/src/app/actions/site-settings.ts`, `site/src/components/admin/SiteSettingsForm.tsx`, `site/src/app/admin/configuracoes/page.tsx`
- Test: `site/tests/lib/actions/site-settings.test.ts`, `site/tests/components/admin/SiteSettingsForm.test.tsx`

**Interfaces:**
- Consumes: `getSiteSetting` (Task 7).
- Produces: `setSiteSetting(client, key, value)`; server action `adminSetSiteSetting(key, value)`; `<SiteSettingsForm locationVideoUrl={string | null} />`.

- [ ] **Step 1: Write the failing test for the action**

`site/tests/lib/actions/site-settings.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { setSiteSetting } from '@/lib/actions/site-settings'

describe('setSiteSetting', () => {
  it('upserts the key/value pair', async () => {
    const chain: any = { upsert: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await setSiteSetting(client as any, 'location_video_url', 'https://example.com/video.mp4')
    expect(client.from).toHaveBeenCalledWith('site_settings')
    expect(chain.upsert).toHaveBeenCalledWith({ key: 'location_video_url', value: 'https://example.com/video.mp4' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd site && npx vitest run tests/lib/actions/site-settings.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the action and server-action wrapper**

`site/src/lib/actions/site-settings.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function setSiteSetting(client: SupabaseClient, key: string, value: string): Promise<void> {
  const { error } = await client.from('site_settings').upsert({ key, value })
  if (error) throw error
}
```

`site/src/app/actions/site-settings.ts`:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { setSiteSetting } from '@/lib/actions/site-settings'

export async function adminSetSiteSetting(key: string, value: string) {
  const client = await createServerSupabaseClient()
  await setSiteSetting(client, key, value)
  revalidatePath('/admin/configuracoes')
  revalidatePath('/')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd site && npx vitest run tests/lib/actions/site-settings.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the settings form**

`site/tests/components/admin/SiteSettingsForm.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const adminSetSiteSetting = vi.fn()
vi.mock('@/app/actions/site-settings', () => ({ adminSetSiteSetting }))

import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm'

describe('SiteSettingsForm', () => {
  it('saves the location video URL', async () => {
    render(<SiteSettingsForm locationVideoUrl={null} />)
    fireEvent.change(screen.getByLabelText(/vídeo de localização/i), { target: { value: 'https://example.com/como-chegar.mp4' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('location_video_url', 'https://example.com/como-chegar.mp4'))
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd site && npx vitest run tests/components/admin/SiteSettingsForm.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Implement the form and page**

`site/src/components/admin/SiteSettingsForm.tsx`:
```tsx
'use client'

import type { FormEvent } from 'react'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'

export function SiteSettingsForm({ locationVideoUrl }: { locationVideoUrl: string | null }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSetSiteSetting('location_video_url', String(formData.get('locationVideoUrl') || ''))
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3">
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
  )
}
```

`site/src/app/admin/configuracoes/page.tsx`:
```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm'

export default async function AdminConfiguracoesPage() {
  const client = await createServerSupabaseClient()
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Configurações</h1>
      <SiteSettingsForm locationVideoUrl={locationVideoUrl} />
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd site && npx vitest run tests/components/admin/SiteSettingsForm.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/src/lib/actions/site-settings.ts site/src/app/actions/site-settings.ts site/src/components/admin/SiteSettingsForm.tsx site/src/app/admin/configuracoes site/tests/lib/actions/site-settings.test.ts site/tests/components/admin/SiteSettingsForm.test.tsx
git commit -m "feat(site): add admin configurações page for the location video URL"
```

---

### Task 27: Production build check and deployment docs

**Files:**
- Create: `site/README.md`, `site/vercel.json`

**Interfaces:**
- Consumes: nothing new — this task wires together everything built in Tasks 1–26 for deployment.

- [ ] **Step 1: Run the full test suite**

Run: `cd site && npx vitest run`
Expected: PASS — every test file from Tasks 1–26 passes together.

- [ ] **Step 2: Run a production build**

Run: `cd site && npm run build`
Expected: builds successfully. If it fails on a missing env var at build time, confirm `site/.env.local` (from Task 2, Step 5) is present locally — Next.js needs `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time for the client bundle.

- [ ] **Step 3: Write `site/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

- [ ] **Step 4: Write the deployment README**

`site/README.md`:
```markdown
# Aguiar Veículos — Site

## Rodando localmente
1. `npm install`
2. `npx supabase start` (requer Docker) — sobe Postgres/Auth/Storage local e aplica `supabase/migrations/`.
3. Copie `.env.local.example` para `.env.local` e preencha com a `API URL`/`anon key` impressas pelo `supabase start`.
4. `npm run dev`

## Testes
`npm test` — roda a suíte Vitest (unitários e de integração leve, com Supabase mockado; nenhum teste depende de rede).

## Deploy (Vercel + Supabase de produção)
1. Crie um projeto Supabase de produção (via painel Supabase, ou pelo conector MCP autorizado nesta sessão) e rode `npx supabase link` + `npx supabase db push` para aplicar as migrations.
2. No painel do projeto Supabase: Authentication → crie o usuário admin (e-mail/senha) que vai logar em `/admin`.
3. Na Vercel: importe o repositório, aponte o "Root Directory" para `site/`, e configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (do projeto Supabase de produção)
   - `APIPLACAS_API_KEY` (nunca em texto puro fora do painel da Vercel)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER=5598991030107`
4. Deploy. Depois de validar o preview, aponte o DNS de `aguiarveiculos.com` para a Vercel (registro A/CNAME conforme instruções da própria Vercel ao adicionar o domínio no projeto).
5. Cadastre os primeiros depoimentos e a foto/história do "15 anos" pelo painel `/admin` antes de divulgar o link (itens em aberto 1 e 8 da spec).
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/pedroipereira/Documents/websites /AguiarVeiculoss"
git add site/README.md site/vercel.json
git commit -m "docs(site): add Vercel config and deployment README"
```

---

## Self-Review Notes

- **Spec coverage:** Arquitetura (Task 1–3, 27), modelo de dados/RLS (Task 2), ApiPlacas (Task 23), todas as 9 seções da home (Tasks 10–17), `/estoque` e `/estoque/[slug]` (Tasks 18–19), painel admin completo — veículos/depoimentos/leads/configurações (Tasks 20–26), casos-limite (estoque vazio → Task 12, veículo sem fotos → Task 19 handles null images gracefully via absent gallery, depoimentos vazio → Task 14, 404 → Task 19, formulários com validação → Task 13, placa sem resultado → Task 23) are each covered by a task above.
- **Placeholder scan:** No "TBD"/"implement later" text remains; the one deliberately-marked placeholder (`/images/antonio-aguiar.jpg` in Task 15) is a real, swappable asset path tied to spec's own open item 1, not a code stub.
- **Type consistency:** `VehiclePublic`/`Vehicle`/`VehicleImage`/`Testimonial`/`Lead`/`LeadType`/`VehicleStatus` (Task 3) are reused verbatim through Tasks 6–26; `SaveVehicleInput`/`SaveTestimonialInput` extend the Task 5 `VehicleFormValues` and the local shapes consistently; server action names (`adminSaveVehicle`, `adminDeleteVehicle`, `adminSetVehicleFeatured`, `adminSetVehicleStatus`, `adminSaveTestimonial`, `adminDeleteTestimonial`, `adminSetTestimonialPublished`, `adminSetSiteSetting`) match between their definition task and every consuming component.
