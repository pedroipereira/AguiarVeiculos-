import type { SupabaseClient } from '@supabase/supabase-js'
import type { SiteImageSlot } from '../types'

export async function addSiteImage(
  client: SupabaseClient,
  slot: SiteImageSlot,
  storagePath: string,
): Promise<{ id: string }> {
  const { count, error: countError } = await client
    .from('site_images')
    .select('id', { count: 'exact', head: true })
    .eq('slot', slot)
  if (countError) throw countError

  const { data, error } = await client
    .from('site_images')
    .insert({ slot, storage_path: storagePath, display_order: count ?? 0 })
    .select('id')
    .single()
  if (error) throw error
  return data as { id: string }
}

export async function deleteSiteImage(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('site_images').delete().eq('id', id)
  if (error) throw error
}

/** Persists a new display order: each id's index in `orderedIds` becomes its `display_order`. */
export async function reorderSiteImages(client: SupabaseClient, orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) => client.from('site_images').update({ display_order: index }).eq('id', id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}

/** For single-photo slots (hero, sobre): drops whatever was there and stores just this one. */
export async function replaceSiteImage(
  client: SupabaseClient,
  slot: SiteImageSlot,
  storagePath: string,
): Promise<{ id: string }> {
  const { error: deleteError } = await client.from('site_images').delete().eq('slot', slot)
  if (deleteError) throw deleteError

  const { data, error } = await client
    .from('site_images')
    .insert({ slot, storage_path: storagePath, display_order: 0 })
    .select('id')
    .single()
  if (error) throw error
  return data as { id: string }
}
