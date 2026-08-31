import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllVehiclesAdmin } from '@/lib/queries/vehicles'
import { VehicleTable } from '@/components/admin/VehicleTable'

export default async function AdminVeiculosPage() {
  const client = await createServerSupabaseClient()
  const vehicles = await getAllVehiclesAdmin(client)

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
      <VehicleTable vehicles={vehicles} />
    </div>
  )
}
