export type VehicleStatus = 'available' | 'preparing' | 'sold'

export type VehicleExpenseCategory =
  | 'pintura'
  | 'lavagem_higienizacao'
  | 'mecanica'
  | 'documentacao'
  | 'funilaria'
  | 'outros'

export interface VehicleExpense {
  id: string
  vehicle_id: string
  category: VehicleExpenseCategory
  description: string | null
  amount_cents: number
  created_at: string
}

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
  engine: string | null
  fuel_tank_liters: number | null
  seating_capacity: number | null
  body_type: string | null
  doors: number | null
  horsepower: number | null
  is_featured: boolean
  status: VehicleStatus
  created_at: string
  updated_at: string
}

export interface Vehicle extends VehiclePublic {
  plate: string | null
  acquired_at: string | null
  acquisition_cost_cents: number | null
  min_sale_price_cents: number | null
  sale_price_cents: number | null
  sold_at: string | null
  buyer_lead_id: string | null
  fipe_brand_code: string | null
  fipe_model_code: string | null
  fipe_year_code: string | null
  fipe_value_cents: number | null
  fipe_fetched_at: string | null
  optionals: string[]
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

export type SiteImageSlot = 'hero' | 'galeria' | 'sobre'

export interface SiteImage {
  id: string
  slot: SiteImageSlot
  storage_path: string
  display_order: number
  created_at: string
}

export type LeadType = 'financing' | 'trade_in' | 'manual'

export type LeadStage = 'novo' | 'visita_marcada' | 'negociando' | 'ligar_de_volta' | 'vendeu' | 'nao_comprou'

export interface Lead {
  id: string
  type: LeadType
  name: string
  phone: string
  details: Record<string, unknown> | null
  vehicle_id: string | null
  stage: LeadStage
  first_contact_at: string | null
  store_visit_at: string | null
  scheduled_visit_date: string | null
  scheduled_visit_time: string | null
  callback_at: string | null
  callback_time: string | null
  notes: string | null
  created_at: string
}
