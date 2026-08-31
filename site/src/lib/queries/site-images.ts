import type { SupabaseClient } from '@supabase/supabase-js'
import type { SiteImage, SiteImageSlot } from '../types'
import { getPublicImageUrl } from '../storage'

export async function getSiteImages(client: SupabaseClient, slot: SiteImageSlot): Promise<SiteImage[]> {
  const { data, error } = await client
    .from('site_images')
    .select('*')
    .eq('slot', slot)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data as SiteImage[]
}

/** Same rows as `getSiteImages`, already converted to public Storage URLs. */
export async function getSiteImageUrls(client: SupabaseClient, slot: SiteImageSlot): Promise<string[]> {
  const images = await getSiteImages(client, slot)
  return images.map((image) => getPublicImageUrl(client, 'site-images', image.storage_path))
}
