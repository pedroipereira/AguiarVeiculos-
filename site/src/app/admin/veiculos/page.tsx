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
        <h1 className="text-2xl font-bold uppercase">Veículos</h1>
        <Link href="/admin/veiculos/novo" className="rounded bg-aguiar-red px-4 py-2 font-bold uppercase text-white">
          Novo veículo
        </Link>
      </div>
      <VehicleTable vehicles={vehicles} />
    </div>
  )
}
