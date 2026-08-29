import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleImage } from '../types'

export async function getVehicleImages(client: SupabaseClient, vehicleId: string): Promise<VehicleImage[]> {
  const { data, error } = await client
    .from('vehicle_images')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data as VehicleImage[]
}
