import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleStatus } from '../types'
import { vehicleFormSchema, type VehicleFormValues } from '../validation'
import { buildVehicleSlug } from '../format'

export interface SaveVehicleInput extends VehicleFormValues {
  id?: string
  imagePaths: string[]
}

export async function saveVehicle(client: SupabaseClient, input: SaveVehicleInput): Promise<{ id: string }> {
  // Throws a ZodError on bad input (e.g. an empty year field arriving as NaN),
  // which would otherwise be written straight into a `not null integer` column.
  const values = vehicleFormSchema.parse(input)

  const payload = {
    brand: values.brand,
    model: values.model,
    version: values.version ?? null,
    year_model: values.yearModel,
    year_fabrication: values.yearFabrication,
    mileage_km: values.mileageKm,
    price_cents: values.priceCents,
    fuel_type: values.fuelType ?? null,
    transmission: values.transmission ?? null,
    color: values.color ?? null,
    description: values.description ?? null,
    plate: values.plate ?? null,
  }

  let vehicleId = input.id
  if (vehicleId) {
    // The slug is deliberately left out of the update: it is part of every link
    // already shared for this vehicle, so editing must never change it.
    const { error } = await client.from('vehicles').update(payload).eq('id', vehicleId)
    if (error) throw error
  } else {
    const idFragment = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    const slug = buildVehicleSlug(values.brand, values.model, values.yearModel, idFragment)
    const { data, error } = await client.from('vehicles').insert({ ...payload, slug }).select('id').single()
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
