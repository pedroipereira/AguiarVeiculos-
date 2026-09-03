import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllLeadsAdmin } from '@/lib/queries/leads'
import { getCurrentMonthValue } from '@/lib/lead-summary'
import { AgendaCalendar } from '@/components/admin/AgendaCalendar'

export default async function AdminAgendaPage() {
  const client = await createServerSupabaseClient()
  const leads = await getAllLeadsAdmin(client)

  return <AgendaCalendar leads={leads} initialMonth={getCurrentMonthValue()} />
}
