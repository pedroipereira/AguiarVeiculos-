import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAvailableVehicles, getVehicleFacets } from '@/lib/queries/vehicles'
import { getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'
import { parseVehicleFiltersFromSearchParams } from '@/lib/filter-vehicles'
import { VehicleCatalogControls } from '@/components/catalog/VehicleCatalogControls'
import { VehicleCard } from '@/components/catalog/VehicleCard'

export const metadata: Metadata = {
  title: 'Estoque de veículos',
  description:
    'Veja todos os carros, motos e utilitários disponíveis na Aguiar Veículos em Presidente Dutra - MA. Filtre por marca, preço, ano e mais.',
  alternates: { canonical: '/estoque' },
}

interface EstoquePageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const params = await searchParams
  const client = await createServerSupabaseClient()
  const [vehicles, facets, allVehicles] = await Promise.all([
    getAvailableVehicles(client, parseVehicleFiltersFromSearchParams(params)),
    getVehicleFacets(client),
    // Unfiltered, for the instant-search overlay — it always searches the
    // whole stock, independent of whatever filters are active on the page.
    getAvailableVehicles(client),
  ])
  const [imageUrls, allVehicleImageUrls] = await Promise.all([
    getPrimaryImageUrlsByVehicleIds(client, vehicles.map((vehicle) => vehicle.id)),
    getPrimaryImageUrlsByVehicleIds(client, allVehicles.map((vehicle) => vehicle.id)),
  ])

  return (
    <main className="bg-white px-6 pb-16 pt-32 text-graphite">
      <div className="mx-auto max-w-[1156px]">
        <p className="mb-6 text-sm text-support-gray">
          <Link href="/" className="hover:text-aguiar-red">
            Início
          </Link>
          {' / '}
          <span className="text-graphite">Nossos Veículos</span>
        </p>

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
              <p className="text-sm font-bold uppercase tracking-widest text-support-gray">Nossos Veículos</p>
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">Encontre o seu próximo carro</h1>
          </div>
          <p className="max-w-sm text-support-gray">
            Seminovos selecionados e revisados. Filtre por marca, preço e mais — qualquer dúvida é
            só chamar no WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          <VehicleCatalogControls
            filtersProps={{
              brands: facets.brands,
              minPriceCents: facets.minPriceCents,
              mileageRangeKm: facets.mileageRangeKm,
              transmissions: facets.transmissions,
              fuelTypes: facets.fuelTypes,
              resultCount: vehicles.length,
            }}
            resultCount={vehicles.length}
            allVehicles={allVehicles}
            allVehicleImageUrls={allVehicleImageUrls}
          >
            {vehicles.length === 0 ? (
              <p className="text-support-gray">Nenhum veículo encontrado com esses filtros.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} imageUrl={imageUrls[vehicle.id]} />
                ))}
              </div>
            )}
          </VehicleCatalogControls>
        </div>
      </div>
    </main>
  )
}
