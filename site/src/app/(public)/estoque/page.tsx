import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAvailableVehicles } from '@/lib/queries/vehicles'
import { getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'
import { parseVehicleFiltersFromSearchParams } from '@/lib/filter-vehicles'
import { VehicleFilters } from '@/components/catalog/VehicleFilters'
import { VehicleCard } from '@/components/catalog/VehicleCard'

interface EstoquePageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const params = await searchParams
  const client = await createServerSupabaseClient()
  const vehicles = await getAvailableVehicles(client, parseVehicleFiltersFromSearchParams(params))
  const imageUrls = await getPrimaryImageUrlsByVehicleIds(client, vehicles.map((vehicle) => vehicle.id))

  return (
    <main className="px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold uppercase">Estoque completo</h1>
      <VehicleFilters />
      {vehicles.length === 0 ? (
        <p className="text-support-gray">Nenhum veículo encontrado com esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} imageUrl={imageUrls[vehicle.id]} />
          ))}
        </div>
      )}
    </main>
  )
}
