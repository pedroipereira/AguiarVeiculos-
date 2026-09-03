import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { getVehicleExpenseTotals } from '@/lib/queries/vehicle-expenses'
import { parseTurnoverThreshold, daysInStock } from '@/lib/vehicle-stock'
import { parseMonthlySalesGoal } from '@/lib/dashboard'
import { getLeadSummaryCounts, getCurrentMonthValue } from '@/lib/lead-summary'
import { StockTurnoverCard } from '@/components/admin/StockTurnoverCard'
import { StockAgingList } from '@/components/admin/StockAgingList'
import { GoalProgressBanner } from '@/components/admin/GoalProgressBanner'
import { SalesPanel } from '@/components/admin/SalesPanel'
import { StoreSnapshotCard } from '@/components/admin/StoreSnapshotCard'
import { LeadFunnelChart } from '@/components/admin/LeadFunnelChart'
import { SalesTimeSeriesChart } from '@/components/admin/SalesTimeSeriesChart'

export default async function AdminPainelPage() {
  const client = await createServerSupabaseClient()
  const [vehicles, leads, thresholdSetting, goalSetting] = await Promise.all([
    getAllVehiclesAdmin(client),
    getAllLeadsAdmin(client),
    getSiteSetting(client, 'stock_turnover_threshold_days'),
    getSiteSetting(client, 'monthly_sales_goal'),
  ])
  const expenseTotals = await getVehicleExpenseTotals(client, vehicles.map((vehicle) => vehicle.id))

  const thresholdDays = parseTurnoverThreshold(thresholdSetting)
  const goal = parseMonthlySalesGoal(goalSetting)
  const soldInCurrentMonth = getLeadSummaryCounts(leads, vehicles, getCurrentMonthValue()).soldInMonth

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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold uppercase">Painel</h1>

      <GoalProgressBanner soldCount={soldInCurrentMonth} goal={goal} />

      <SalesPanel
        vehicles={vehicles}
        expenseTotals={expenseTotals}
        goal={goal}
        soldCount={soldInCurrentMonth}
        leads={leads}
        thresholdDays={thresholdDays}
      />

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold">Sua loja agora</h2>
          <p className="text-sm text-support-gray">Foto do momento · não muda com o período</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <StoreSnapshotCard vehicles={vehicles} expenseTotals={expenseTotals} />
          <LeadFunnelChart leads={leads} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <StockTurnoverCard
          avgDays={avgDays}
          availableCount={availableAged.length}
          staleCount={staleCount}
          thresholdDays={thresholdDays}
        />
        <StockAgingList
          vehicles={availableAged.slice(0, 4).map(({ vehicle, days }) => ({
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

      <SalesTimeSeriesChart vehicles={vehicles} />
    </div>
  )
}
