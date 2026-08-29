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
