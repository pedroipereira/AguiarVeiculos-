import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getAllVehiclesAdmin, getVehicleOptionsAdmin } from '@/lib/queries/vehicles'
import { LeadsOverview } from '@/components/admin/LeadsOverview'

export default async function AdminLeadsPage() {
  const client = await createServerSupabaseClient()
  const [leads, vehicles, vehicleOptions] = await Promise.all([
    getAllLeadsAdmin(client),
    getAllVehiclesAdmin(client),
    getVehicleOptionsAdmin(client),
  ])

  return <LeadsOverview leads={leads} vehicles={vehicles} vehicleOptions={vehicleOptions} />
}
