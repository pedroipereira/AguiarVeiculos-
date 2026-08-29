import type { SupabaseClient } from '@supabase/supabase-js'

export async function getSiteSetting(client: SupabaseClient, key: string): Promise<string | null> {
  const { data, error } = await client.from('site_settings').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data?.value ?? null
}
