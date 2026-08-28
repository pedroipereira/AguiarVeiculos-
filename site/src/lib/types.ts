export type VehicleStatus = 'available' | 'sold'

export interface VehiclePublic {
  id: string
  slug: string
  brand: string
  model: string
  version: string | null
  year_model: number
  year_fabrication: number
  mileage_km: number
  price_cents: number
  fuel_type: string | null
  transmission: string | null
  color: string | null
  description: string | null
  is_featured: boolean
  status: VehicleStatus
  created_at: string
  updated_at: string
}

export interface Vehicle extends VehiclePublic {
  plate: string | null
}

export interface VehicleImage {
  id: string
  vehicle_id: string
  storage_path: string
  display_order: number
}

export interface Testimonial {
  id: string
  image_url: string
  caption: string
  display_order: number
  is_published: boolean
  created_at: string
}

export type LeadType = 'financing' | 'trade_in'

export interface Lead {
  id: string
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown> | null
  vehicle_id: string | null
  created_at: string
}
