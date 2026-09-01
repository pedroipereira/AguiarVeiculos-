import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'
import { getVehicleExpenseTotals } from '@/lib/queries/vehicle-expenses'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { parseTurnoverThreshold } from '@/lib/vehicle-stock'
import { VehicleStockGrid } from '@/components/admin/VehicleStockGrid'

export default async function AdminVeiculosPage() {
  const client = await createServerSupabaseClient()
  const vehicles = await getAllVehiclesAdmin(client)
  const vehicleIds = vehicles.map((vehicle) => vehicle.id)

  const [coverImageUrls, expenseTotalsCents, leads, thresholdSetting] = await Promise.all([
    getPrimaryImageUrlsByVehicleIds(client, vehicleIds),
    getVehicleExpenseTotals(client, vehicleIds),
    getAllLeadsAdmin(client),
    getSiteSetting(client, 'stock_turnover_threshold_days'),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <Link
          href="/admin/veiculos/novo"
          className="rounded-lg bg-aguiar-red px-5 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          Cadastrar veículo
        </Link>
      </div>
      <VehicleStockGrid
        vehicles={vehicles}
        coverImageUrls={coverImageUrls}
        expenseTotalsCents={expenseTotalsCents}
        thresholdDays={parseTurnoverThreshold(thresholdSetting)}
        leads={leads}
      />
    </div>
  )
}
