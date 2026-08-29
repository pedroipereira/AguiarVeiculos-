import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vehicle, VehiclePublic } from '../types'

export interface VehicleFilters {
  brand?: string
  minPriceCents?: number
  maxPriceCents?: number
  year?: number
}

export async function getFeaturedVehicles(client: SupabaseClient, limit = 6): Promise<VehiclePublic[]> {
  const { data, error } = await client
    .from('vehicles_public')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as VehiclePublic[]
}

export async function getAvailableVehicles(client: SupabaseClient, filters: VehicleFilters = {}): Promise<VehiclePublic[]> {
  let query = client.from('vehicles_public').select('*').eq('status', 'available')
  // Case-insensitive partial match: the brand filter is free-text user input,
  // so "fiat" must still find the vehicles stored as "Fiat".
  if (filters.brand) query = query.ilike('brand', `%${filters.brand}%`)
  if (filters.year) query = query.eq('year_model', filters.year)
  if (filters.minPriceCents != null) query = query.gte('price_cents', filters.minPriceCents)
  if (filters.maxPriceCents != null) query = query.lte('price_cents', filters.maxPriceCents)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data as VehiclePublic[]
}

export async function getVehicleBySlug(client: SupabaseClient, slug: string): Promise<VehiclePublic | null> {
  // A sold vehicle must fall through to the friendly 404 (spec §Erros), so it is
  // excluded here rather than rendered as a still-for-sale detail page.
  const { data, error } = await client
    .from('vehicles_public')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'available')
    .maybeSingle()
  if (error) throw error
  return (data as VehiclePublic) ?? null
}

export async function getAllVehiclesAdmin(client: SupabaseClient): Promise<Vehicle[]> {
  const { data, error } = await client.from('vehicles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Vehicle[]
}

export async function getVehicleByIdAdmin(client: SupabaseClient, id: string): Promise<Vehicle | null> {
  const { data, error } = await client.from('vehicles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Vehicle) ?? null
}
