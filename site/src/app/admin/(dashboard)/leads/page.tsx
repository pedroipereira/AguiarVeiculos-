import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getVehicleOptionsAdmin } from '@/lib/queries/vehicles'
import { LeadKanbanBoard } from '@/components/admin/LeadKanbanBoard'

export default async function AdminLeadsPage() {
  const client = await createServerSupabaseClient()
  const [leads, vehicles] = await Promise.all([getAllLeadsAdmin(client), getVehicleOptionsAdmin(client)])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Leads</h1>
      {leads.length === 0 ? (
        <p className="text-support-gray">Nenhum lead recebido ainda.</p>
      ) : (
        <LeadKanbanBoard leads={leads} vehicles={vehicles} />
      )}
    </div>
  )
}
