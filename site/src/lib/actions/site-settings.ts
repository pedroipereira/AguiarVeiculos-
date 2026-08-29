import type { SupabaseClient } from '@supabase/supabase-js'

export async function setSiteSetting(client: SupabaseClient, key: string, value: string): Promise<void> {
  const { error } = await client.from('site_settings').upsert({ key, value })
  if (error) throw error
}
