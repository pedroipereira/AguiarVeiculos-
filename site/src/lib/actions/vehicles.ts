import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleStatus } from '../types'
import type { VehicleFormValues } from '../validation'
import { buildVehicleSlug } from '../format'

export interface SaveVehicleInput extends VehicleFormValues {
  id?: string
  imagePaths: string[]
}

export async function saveVehicle(client: SupabaseClient, input: SaveVehicleInput): Promise<{ id: string }> {
  const idFragment = (input.id ?? crypto.randomUUID()).replace(/-/g, '').slice(0, 8)
  const payload = {
    brand: input.brand,
    model: input.model,
    version: input.version ?? null,
    year_model: input.yearModel,
    year_fabrication: input.yearFabrication,
    mileage_km: input.mileageKm,
    price_cents: input.priceCents,
    fuel_type: input.fuelType ?? null,
    transmission: input.transmission ?? null,
    color: input.color ?? null,
    description: input.description ?? null,
    plate: input.plate ?? null,
    slug: buildVehicleSlug(input.brand, input.model, input.yearModel, idFragment),
  }

  let vehicleId = input.id
  if (vehicleId) {
    const { error } = await client.from('vehicles').update(payload).eq('id', vehicleId)
    if (error) throw error
  } else {
    const { data, error } = await client.from('vehicles').insert(payload).select('id').single()
    if (error) throw error
    vehicleId = (data as { id: string }).id
  }

  await client.from('vehicle_images').delete().eq('vehicle_id', vehicleId)
  if (input.imagePaths.length > 0) {
    const rows = input.imagePaths.map((storage_path, display_order) => ({ vehicle_id: vehicleId, storage_path, display_order }))
    const { error } = await client.from('vehicle_images').insert(rows)
    if (error) throw error
  }

  return { id: vehicleId! }
}

export async function deleteVehicle(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

export async function setVehicleFeatured(client: SupabaseClient, id: string, isFeatured: boolean): Promise<void> {
  const { error } = await client.from('vehicles').update({ is_featured: isFeatured }).eq('id', id)
  if (error) throw error
}

export async function setVehicleStatus(client: SupabaseClient, id: string, status: VehicleStatus): Promise<void> {
  const { error } = await client.from('vehicles').update({ status }).eq('id', id)
  if (error) throw error
}
