import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'
import { getVehicleExpenseTotals } from '@/lib/queries/vehicle-expenses'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { parseTurnoverThreshold, countStockFilters } from '@/lib/vehicle-stock'
import { calculateTotalCostCents } from '@/lib/vehicle-costs'
import { VehicleStockGrid } from '@/components/admin/VehicleStockGrid'
import { StockStatsRow } from '@/components/admin/StockStatsRow'
import { StockPdfExportButton } from '@/components/admin/StockPdfExportButton'
import { anton } from '@/lib/fonts'

export default async function AdminVeiculosPage() {
  const client = await createServerSupabaseClient()
  const vehicles = await getAllVehiclesAdmin(client)
  const vehicleIds = vehicles.map((vehicle) => vehicle.id)

  const [coverImageUrls, expenseTotalsCents, thresholdSetting] = await Promise.all([
    getPrimaryImageUrlsByVehicleIds(client, vehicleIds),
    getVehicleExpenseTotals(client, vehicleIds),
    getSiteSetting(client, 'stock_turnover_threshold_days'),
  ])

  const thresholdDays = parseTurnoverThreshold(thresholdSetting)
  const counts = countStockFilters(vehicles, thresholdDays)
  const availableCount = vehicles.filter((vehicle) => vehicle.status === 'available').length
  const totalCostCentsByVehicleId = Object.fromEntries(
    vehicles.map((vehicle) => [
      vehicle.id,
      calculateTotalCostCents(vehicle.acquisition_cost_cents, [{ amount_cents: expenseTotalsCents[vehicle.id] ?? 0 }]),
    ]),
  )

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`${anton.className} text-4xl uppercase tracking-wide text-graphite`}>Estoque</h1>
          <p className="text-sm text-support-gray">{vehicles.length} veículos no pátio</p>
        </div>
        <div className="flex items-center gap-3">
          <StockPdfExportButton vehicles={vehicles} totalCostCentsByVehicleId={totalCostCentsByVehicleId} />
          <Link
            href="/admin/veiculos/novo"
            className="rounded-full bg-aguiar-red px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-red-700"
          >
            + Adicionar carro
          </Link>
        </div>
      </div>

      <StockStatsRow
        availableCount={availableCount}
        noMarginCount={counts.no_margin}
        staleCount={counts.turnover}
        thresholdDays={thresholdDays}
      />

      <VehicleStockGrid
        vehicles={vehicles}
        coverImageUrls={coverImageUrls}
        expenseTotalsCents={expenseTotalsCents}
        thresholdDays={thresholdDays}
      />
    </div>
  )
}
