import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { LeadTable } from '@/components/admin/LeadTable'

export default async function AdminLeadsPage() {
  const client = await createServerSupabaseClient()
  const leads = await getAllLeadsAdmin(client)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Leads</h1>
      {leads.length === 0 ? <p className="text-support-gray">Nenhum lead recebido ainda.</p> : <LeadTable leads={leads} />}
    </div>
  )
}
