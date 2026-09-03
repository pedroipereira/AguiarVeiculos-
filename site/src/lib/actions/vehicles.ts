import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import type { VehicleStatus } from '../types'
import { vehicleFormSchema, markVehicleSoldSchema } from '../validation'
import { buildVehicleSlug } from '../format'
import { normalizeTransmission, normalizeFuelType, normalizeColor } from '../normalize'
import { updateLeadStage } from './leads'

export interface SaveVehicleInput extends z.input<typeof vehicleFormSchema> {
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
    // Normalized so admins typing "automatico"/"Automático"/"AUTOMÁTICO" (and
    // similar case/accent variants for fuel and color) all collapse to one
    // canonical stored value, instead of fragmenting the public filter pills.
    fuel_type: normalizeFuelType(values.fuelType),
    transmission: normalizeTransmission(values.transmission),
    color: normalizeColor(values.color),
    description: values.description ?? null,
    engine: values.engine ?? null,
    fuel_tank_liters: values.fuelTankLiters ?? null,
    seating_capacity: values.seatingCapacity ?? null,
    body_type: values.bodyType ?? null,
    doors: values.doors ?? null,
    horsepower: values.horsepower ?? null,
    plate: values.plate ?? null,
    is_featured: values.isFeatured ?? false,
    acquisition_cost_cents: values.acquisitionCostCents ?? null,
    min_sale_price_cents: values.minSalePriceCents ?? null,
    acquired_at: values.acquiredAt ?? null,
    fipe_brand_code: values.fipeBrandCode ?? null,
    fipe_model_code: values.fipeModelCode ?? null,
    fipe_year_code: values.fipeYearCode ?? null,
    fipe_value_cents: values.fipeValueCents ?? null,
    fipe_fetched_at: values.fipeFetchedAt ?? null,
    optionals: values.optionals,
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

  await client.from('vehicle_expenses').delete().eq('vehicle_id', vehicleId)
  if (values.expenses.length > 0) {
    const expenseRows = values.expenses.map((expense) => ({
      vehicle_id: vehicleId,
      category: expense.category,
      description: expense.description ?? null,
      amount_cents: expense.amountCents,
    }))
    const { error: expensesError } = await client.from('vehicle_expenses').insert(expenseRows)
    if (expensesError) throw expensesError
  }

  return { id: vehicleId! }
}

export async function deleteVehicle(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

export interface MarkVehicleSoldInput {
  salePriceCents: number
  soldAt: string
  buyerLeadId?: string
}

export async function markVehicleSold(client: SupabaseClient, id: string, input: MarkVehicleSoldInput): Promise<void> {
  const values = markVehicleSoldSchema.parse(input)
  const { error } = await client
    .from('vehicles')
    .update({
      status: 'sold',
      sale_price_cents: values.salePriceCents,
      sold_at: values.soldAt,
      buyer_lead_id: values.buyerLeadId ?? null,
    })
    .eq('id', id)
  if (error) throw error

  // The kanban's own "Vendeu" drag flips the lead's stage as part of
  // completing the sale; this is the other place a sale gets recorded
  // (Estoque's "Marcar como vendido"), and it linked a buyer without ever
  // moving them off whatever kanban column they were sitting in — so a
  // buyer marked sold from Estoque never left the funnel. Mirror the same
  // stage flip here whenever a buyer is linked.
  if (values.buyerLeadId) {
    await updateLeadStage(client, values.buyerLeadId, 'vendeu')
  }
}

export async function setVehicleFeatured(client: SupabaseClient, id: string, isFeatured: boolean): Promise<void> {
  const { error } = await client.from('vehicles').update({ is_featured: isFeatured }).eq('id', id)
  if (error) throw error
}

export async function setVehicleStatus(client: SupabaseClient, id: string, status: VehicleStatus): Promise<void> {
  const payload: Record<string, unknown> = { status }
  if (status !== 'sold') {
    payload.sale_price_cents = null
    payload.sold_at = null
    payload.buyer_lead_id = null
  }
  const { error } = await client.from('vehicles').update(payload).eq('id', id)
  if (error) throw error
}
