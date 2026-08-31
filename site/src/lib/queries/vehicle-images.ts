import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleImage } from '../types'
import { getPublicImageUrl } from '../storage'

export async function getVehicleImages(client: SupabaseClient, vehicleId: string): Promise<VehicleImage[]> {
  const { data, error } = await client
    .from('vehicle_images')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data as VehicleImage[]
}

/**
 * Batched lookup of the primary (lowest `display_order`) photo of each vehicle,
 * already converted to a public Storage URL. One query for the whole list, so a
 * catalog page never fans out into one request per card.
 */
export async function getPrimaryImageUrlsByVehicleIds(
  client: SupabaseClient,
  vehicleIds: string[],
): Promise<Record<string, string>> {
  if (vehicleIds.length === 0) return {}

  const { data, error } = await client
    .from('vehicle_images')
    .select('*')
    .in('vehicle_id', vehicleIds)
    .order('display_order', { ascending: true })
  if (error) throw error

  const urls: Record<string, string> = {}
  for (const image of (data ?? []) as VehicleImage[]) {
    // Rows arrive ordered by display_order, so the first row seen for a vehicle
    // is its primary photo — later rows for the same vehicle are ignored.
    if (urls[image.vehicle_id]) continue
    urls[image.vehicle_id] = getPublicImageUrl(client, 'vehicle-images', image.storage_path)
  }
  return urls
}

/** Batched photo count per vehicle, for the "📷 N" badge on catalog cards. */
export async function getImageCountsByVehicleIds(
  client: SupabaseClient,
  vehicleIds: string[],
): Promise<Record<string, number>> {
  if (vehicleIds.length === 0) return {}

  const { data, error } = await client.from('vehicle_images').select('vehicle_id').in('vehicle_id', vehicleIds)
  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as Pick<VehicleImage, 'vehicle_id'>[]) {
    counts[row.vehicle_id] = (counts[row.vehicle_id] ?? 0) + 1
  }
  return counts
}
