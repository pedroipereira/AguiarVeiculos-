import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleByIdAdmin } from '@/lib/queries/vehicles'
import { getVehicleImages } from '@/lib/queries/vehicle-images'
import { getVehicleExpenses } from '@/lib/queries/vehicle-expenses'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { getPublicImageUrl } from '@/lib/storage'
import { calculateTotalCostCents } from '@/lib/vehicle-costs'
import { parseTurnoverThreshold } from '@/lib/vehicle-stock'
import { VehicleSummaryPanel } from '@/components/admin/VehicleSummaryPanel'

interface VehicleSummaryPageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleSummaryPage({ params }: VehicleSummaryPageProps) {
  const { id } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleByIdAdmin(client, id)
  if (!vehicle) notFound()

  const [images, expenses, leads, thresholdSetting] = await Promise.all([
    getVehicleImages(client, id),
    getVehicleExpenses(client, id),
    getAllLeadsAdmin(client),
    getSiteSetting(client, 'stock_turnover_threshold_days'),
  ])

  const imageUrls = images.map((image) => getPublicImageUrl(client, 'vehicle-images', image.storage_path))
  const totalCostCents = calculateTotalCostCents(vehicle.acquisition_cost_cents, expenses)

  return (
    <VehicleSummaryPanel
      vehicle={vehicle}
      imageUrls={imageUrls}
      totalCostCents={totalCostCents}
      thresholdDays={parseTurnoverThreshold(thresholdSetting)}
      leads={leads}
    />
  )
}
