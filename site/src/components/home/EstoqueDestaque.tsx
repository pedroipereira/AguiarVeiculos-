import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getFeaturedVehicles } from '@/lib/queries/vehicles'
import { getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'
import { Section, type SectionTone } from '@/components/ui/Section'
import { VehicleCard } from '@/components/catalog/VehicleCard'

export async function EstoqueDestaque({ client, tone }: { client: SupabaseClient; tone?: SectionTone }) {
  const vehicles = await getFeaturedVehicles(client)
  if (vehicles.length === 0) return null

  const imageUrls = await getPrimaryImageUrlsByVehicleIds(client, vehicles.map((vehicle) => vehicle.id))

  return (
    <Section eyebrow="Estoque" title="Destaques do estoque" tone={tone} contained>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} imageUrl={imageUrls[vehicle.id]} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          href="/estoque"
          className="inline-flex items-center justify-center rounded-full bg-aguiar-red px-10 py-4 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
        >
          Veja todos os nossos veículos
        </Link>
      </div>
    </Section>
  )
}
