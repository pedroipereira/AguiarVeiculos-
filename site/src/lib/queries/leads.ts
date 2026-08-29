import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from '../types'

export async function getAllLeadsAdmin(client: SupabaseClient): Promise<Lead[]> {
  const { data, error } = await client.from('leads').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Lead[]
}
