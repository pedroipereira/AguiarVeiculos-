import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadType } from '../types'

export interface CreateLeadInput {
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown>
  vehicleId?: string
}

// Anonymous visitors can only INSERT into `leads` (no SELECT policy for them —
// that data is only readable by authenticated admins). Selecting the row back
// via `.select().single()` would apply the SELECT policy to the RETURNING
// clause and fail with a row-level security error, even though the insert
// itself succeeded. The caller never uses the inserted id, so we just insert.
export async function createLead(client: SupabaseClient, input: CreateLeadInput): Promise<void> {
  const { error } = await client.from('leads').insert({
    type: input.type,
    name: input.name,
    phone: input.phone,
    details: input.details,
    vehicle_id: input.vehicleId ?? null,
  })
  if (error) throw error
}
