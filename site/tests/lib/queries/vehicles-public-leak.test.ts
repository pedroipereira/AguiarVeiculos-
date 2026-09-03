import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// `optionals` (equipment list) is deliberately NOT in this list — migration
// 0010 added it to the public view on purpose (it isn't financial/internal
// data; it was only ever excluded by riding along with migration 0005's
// blanket comment on a batch of genuinely sensitive columns).
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
  it('never selects any cost, sale, FIPE, acquisition-date, or plate column', () => {
    const viewDefinition = readLatestVehiclesPublicViewDefinition()
    for (const column of SENSITIVE_COLUMNS) {
      expect(viewDefinition).not.toContain(column)
    }
  })
})
