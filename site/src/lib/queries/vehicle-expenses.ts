import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehicleExpense } from '../types'

export async function getVehicleExpenses(client: SupabaseClient, vehicleId: string): Promise<VehicleExpense[]> {
  const { data, error } = await client
    .from('vehicle_expenses')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as VehicleExpense[]
}

/** Batched sum of expenses per vehicle, for the "Custo"/"Lucro" figures on the stock grid. */
export async function getVehicleExpenseTotals(
  client: SupabaseClient,
  vehicleIds: string[],
): Promise<Record<string, number>> {
  if (vehicleIds.length === 0) return {}

  const { data, error } = await client.from('vehicle_expenses').select('vehicle_id, amount_cents').in('vehicle_id', vehicleIds)
  if (error) throw error

  const totals: Record<string, number> = {}
  for (const row of (data ?? []) as Pick<VehicleExpense, 'vehicle_id' | 'amount_cents'>[]) {
    totals[row.vehicle_id] = (totals[row.vehicle_id] ?? 0) + row.amount_cents
  }
  return totals
}
