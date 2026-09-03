import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadType, LeadStage } from '../types'

export interface CreateLeadInput {
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown>
  vehicleId?: string
  stage?: LeadStage
  notes?: string
  firstContactAt?: string
  storeVisitAt?: string
  scheduledVisitDate?: string
  scheduledVisitTime?: string
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
    stage: input.stage ?? 'novo',
    notes: input.notes ?? null,
    first_contact_at: input.firstContactAt ?? null,
    store_visit_at: input.storeVisitAt ?? null,
    scheduled_visit_date: input.scheduledVisitDate ?? null,
    scheduled_visit_time: input.scheduledVisitTime ?? null,
  })
  if (error) throw error
}

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
  const targetStage = input.stage ?? 'novo'
  if (targetStage === 'vendeu' && input.vehicleId) {
    const { data: current, error: fetchError } = await client.from('leads').select('stage').eq('id', id).single()
    if (fetchError) throw fetchError
    if ((current as { stage: LeadStage }).stage !== 'vendeu') {
      throw new Error('Mova para "Comprou" pelo quadro de leads, completando a venda do veículo.')
    }
  }

  const { error } = await client
    .from('leads')
    .update({
      name: input.name,
      phone: input.phone,
      vehicle_id: input.vehicleId ?? null,
      stage: targetStage,
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
