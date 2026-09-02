import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vehicle, VehiclePublic, VehicleStatus } from '../types'

export type VehicleSort = 'recent' | 'price_asc' | 'price_desc' | 'mileage_asc'

export interface VehicleFilters {
  brands?: string[]
  minPriceCents?: number
  maxPriceCents?: number
  minYear?: number
  maxMileageKm?: number
  transmission?: string
  fuelType?: string
  search?: string
  sort?: VehicleSort
}

export interface VehicleBrandFacet {
  brand: string
  count: number
}

export interface VehicleFacets {
  brands: VehicleBrandFacet[]
  minPriceCents: number
  mileageRangeKm: { min: number; max: number }
  transmissions: string[]
  fuelTypes: string[]
}

const SORT_COLUMNS: Record<VehicleSort, { column: string; ascending: boolean }> = {
  recent: { column: 'created_at', ascending: false },
  price_asc: { column: 'price_cents', ascending: true },
  price_desc: { column: 'price_cents', ascending: false },
  mileage_asc: { column: 'mileage_km', ascending: true },
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

/** A handful of other vehicles for the "Outros carros disponíveis" section, excluding the one being viewed. */
export async function getRelatedVehicles(client: SupabaseClient, excludeId: string, limit = 3): Promise<VehiclePublic[]> {
  const { data, error } = await client
    .from('vehicles_public')
    .select('*')
    .eq('status', 'available')
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as VehiclePublic[]
}

export async function getAvailableVehicles(client: SupabaseClient, filters: VehicleFilters = {}): Promise<VehiclePublic[]> {
  let query = client.from('vehicles_public').select('*').eq('status', 'available')
  // Brand options come from the checkbox list built off real distinct values,
  // so an exact match against any of the checked brands is safe here.
  if (filters.brands && filters.brands.length > 0) query = query.in('brand', filters.brands)
  if (filters.minYear != null) query = query.gte('year_model', filters.minYear)
  if (filters.minPriceCents != null) query = query.gte('price_cents', filters.minPriceCents)
  if (filters.maxPriceCents != null) query = query.lte('price_cents', filters.maxPriceCents)
  if (filters.maxMileageKm != null) query = query.lte('mileage_km', filters.maxMileageKm)
  // transmission/fuel_type are free text on the admin form, so match loosely
  // instead of risking an exact-equality miss on casing/accents.
  if (filters.transmission) query = query.ilike('transmission', `%${filters.transmission}%`)
  if (filters.fuelType) query = query.ilike('fuel_type', `%${filters.fuelType}%`)
  if (filters.search) query = query.or(`brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)

  const { column, ascending } = SORT_COLUMNS[filters.sort ?? 'recent']
  const { data, error } = await query.order(column, { ascending })
  if (error) throw error
  return data as VehiclePublic[]
}

export async function getVehicleFacets(client: SupabaseClient): Promise<VehicleFacets> {
  const { data, error } = await client
    .from('vehicles_public')
    .select('brand, price_cents, mileage_km, transmission, fuel_type')
    .eq('status', 'available')
    .order('brand', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as Pick<VehiclePublic, 'brand' | 'price_cents' | 'mileage_km' | 'transmission' | 'fuel_type'>[]

  const brandCounts = new Map<string, number>()
  for (const row of rows) brandCounts.set(row.brand, (brandCounts.get(row.brand) ?? 0) + 1)
  const brands = Array.from(brandCounts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)

  const prices = rows.map((row) => row.price_cents)
  const mileages = rows.map((row) => row.mileage_km)

  const transmissions = Array.from(new Set(rows.map((row) => row.transmission).filter((v): v is string => Boolean(v)))).sort()
  const fuelTypes = Array.from(new Set(rows.map((row) => row.fuel_type).filter((v): v is string => Boolean(v)))).sort()

  return {
    brands,
    minPriceCents: prices.length > 0 ? Math.min(...prices) : 0,
    mileageRangeKm: mileages.length > 0 ? { min: 0, max: Math.max(...mileages) } : { min: 0, max: 0 },
    transmissions,
    fuelTypes,
  }
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

export interface VehicleOption {
  id: string
  brand: string
  model: string
  version: string | null
  status: VehicleStatus
  price_cents: number
}

/** A lightweight vehicle list for pickers (e.g. "veículo de interesse" on the lead quick-add form). */
export async function getVehicleOptionsAdmin(client: SupabaseClient): Promise<VehicleOption[]> {
  const { data, error } = await client
    .from('vehicles')
    .select('id, brand, model, version, status, price_cents')
    .order('brand', { ascending: true })
  if (error) throw error
  return data as VehicleOption[]
}

export async function getVehicleByIdAdmin(client: SupabaseClient, id: string): Promise<Vehicle | null> {
  const { data, error } = await client.from('vehicles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Vehicle) ?? null
}
