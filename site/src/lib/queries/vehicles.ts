import type { SupabaseClient } from '@supabase/supabase-js'
import type { VehiclePublic } from '../types'

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
  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.year) query = query.eq('year_model', filters.year)
  if (filters.minPriceCents != null) query = query.gte('price_cents', filters.minPriceCents)
  if (filters.maxPriceCents != null) query = query.lte('price_cents', filters.maxPriceCents)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data as VehiclePublic[]
}

export async function getVehicleBySlug(client: SupabaseClient, slug: string): Promise<VehiclePublic | null> {
  const { data, error } = await client.from('vehicles_public').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data as VehiclePublic) ?? null
}
