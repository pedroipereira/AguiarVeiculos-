import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getFeaturedVehicles } from '@/lib/queries/vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

export async function EstoqueDestaque({ client }: { client: SupabaseClient }) {
  const vehicles = await getFeaturedVehicles(client)
  if (vehicles.length === 0) return null

  return (
    <Section eyebrow="Estoque" title="Destaques da semana">
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
      <Link href="/estoque" className="mt-8 inline-block font-bold uppercase text-aguiar-red hover:underline">
        Ver todo o estoque
      </Link>
    </Section>
  )
}
