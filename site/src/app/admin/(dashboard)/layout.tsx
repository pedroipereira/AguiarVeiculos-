import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleOptionsAdmin } from '@/lib/queries/vehicles'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const client = await createServerSupabaseClient()
  const [{ data }, vehicles] = await Promise.all([client.auth.getUser(), getVehicleOptionsAdmin(client)])

  return (
    <div className="flex min-h-screen bg-card-gray text-graphite">
      <AdminSidebar vehicles={vehicles} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar userEmail={data.user?.email ?? null} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
