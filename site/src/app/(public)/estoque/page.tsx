import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAvailableVehicles } from '@/lib/queries/vehicles'
import { parseVehicleFiltersFromSearchParams } from '@/lib/filter-vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { VehicleFilters } from '@/components/catalog/VehicleFilters'

interface EstoquePageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const params = await searchParams
  const client = await createServerSupabaseClient()
  const vehicles = await getAvailableVehicles(client, parseVehicleFiltersFromSearchParams(params))

  return (
    <main className="px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold uppercase">Estoque completo</h1>
      <VehicleFilters />
      {vehicles.length === 0 ? (
        <p className="text-support-gray">Nenhum veículo encontrado com esses filtros.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/estoque/${vehicle.slug}`}>
              <Card>
                <p className="font-bold uppercase">
                  {vehicle.brand} {vehicle.model} {vehicle.version}
                </p>
                <p className="text-sm text-support-gray">{vehicle.year_model}</p>
                <p className="mt-2 text-lg font-bold text-aguiar-red">{formatPriceFromCents(vehicle.price_cents)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
