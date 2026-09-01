'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/actions/assert-admin'
import * as vehicleActions from '@/lib/actions/vehicles'
import type { SaveVehicleInput, MarkVehicleSoldInput } from '@/lib/actions/vehicles'
import type { VehicleStatus } from '@/lib/types'

export async function adminSaveVehicle(input: SaveVehicleInput) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  const result = await vehicleActions.saveVehicle(client, input)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
  revalidatePath('/')
  return result
}

export async function adminDeleteVehicle(id: string) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await vehicleActions.deleteVehicle(client, id)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
}

export async function adminSetVehicleFeatured(id: string, isFeatured: boolean) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await vehicleActions.setVehicleFeatured(client, id, isFeatured)
  revalidatePath('/admin/veiculos')
  revalidatePath('/')
}

export async function adminSetVehicleStatus(id: string, status: VehicleStatus) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await vehicleActions.setVehicleStatus(client, id, status)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
}

export async function adminMarkVehicleSold(id: string, input: MarkVehicleSoldInput) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await vehicleActions.markVehicleSold(client, id, input)
  revalidatePath('/admin/veiculos')
  revalidatePath('/estoque')
}
