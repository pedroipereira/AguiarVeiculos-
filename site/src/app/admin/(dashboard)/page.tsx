import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { parseTurnoverThreshold, daysInStock } from '@/lib/vehicle-stock'
import { StockTurnoverCard } from '@/components/admin/StockTurnoverCard'
import { StockAgingList } from '@/components/admin/StockAgingList'

export default async function AdminPainelPage() {
  const client = await createServerSupabaseClient()
  const [vehicles, thresholdSetting] = await Promise.all([
    getAllVehiclesAdmin(client),
    getSiteSetting(client, 'stock_turnover_threshold_days'),
  ])
  const thresholdDays = parseTurnoverThreshold(thresholdSetting)

  const availableAged = vehicles
    .filter((vehicle) => vehicle.status === 'available')
    .map((vehicle) => ({ vehicle, days: daysInStock(vehicle) }))
    .sort((a, b) => b.days - a.days)

  const avgDays =
    availableAged.length > 0
      ? Math.round(availableAged.reduce((sum, { days }) => sum + days, 0) / availableAged.length)
      : 0
  const staleCount = availableAged.filter(({ days }) => days >= thresholdDays).length

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Painel</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StockTurnoverCard
          avgDays={avgDays}
          availableCount={availableAged.length}
          staleCount={staleCount}
          thresholdDays={thresholdDays}
        />
        <StockAgingList
          vehicles={availableAged.slice(0, 6).map(({ vehicle, days }) => ({
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            version: vehicle.version,
            year_model: vehicle.year_model,
            mileage_km: vehicle.mileage_km,
            price_cents: vehicle.price_cents,
            days,
          }))}
        />
      </div>
    </div>
  )
}
