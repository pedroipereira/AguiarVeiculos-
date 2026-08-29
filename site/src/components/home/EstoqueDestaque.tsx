import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getFeaturedVehicles } from '@/lib/queries/vehicles'
import { getPrimaryImageUrlsByVehicleIds } from '@/lib/queries/vehicle-images'
import { Section } from '@/components/ui/Section'
import { VehicleCard } from '@/components/catalog/VehicleCard'

export async function EstoqueDestaque({ client }: { client: SupabaseClient }) {
  const vehicles = await getFeaturedVehicles(client)
  if (vehicles.length === 0) return null

  const imageUrls = await getPrimaryImageUrlsByVehicleIds(client, vehicles.map((vehicle) => vehicle.id))

  return (
    <Section eyebrow="Estoque" title="Destaques da semana">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} imageUrl={imageUrls[vehicle.id]} />
        ))}
      </div>
      <Link href="/estoque" className="mt-8 inline-block font-bold uppercase text-aguiar-red hover:underline">
        Ver todo o estoque
      </Link>
    </Section>
  )
}
