import Link from 'next/link'
import type { VehiclePublic } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'
import { Card } from '@/components/ui/Card'

interface VehicleCardProps {
  vehicle: VehiclePublic
  imageUrl?: string
}

export function VehicleCard({ vehicle, imageUrl }: VehicleCardProps) {
  const label = [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(' ')

  return (
    <Link href={`/estoque/${vehicle.slug}`}>
      <Card>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="mb-4 aspect-[4/3] w-full rounded object-cover"
          />
        ) : (
          <div
            role="presentation"
            data-testid="vehicle-card-placeholder"
            className="mb-4 aspect-[4/3] w-full rounded bg-support-gray/20"
          />
        )}
        <p className="font-bold uppercase">
          {vehicle.brand} {vehicle.model} {vehicle.version}
        </p>
        <p className="text-sm text-support-gray">{vehicle.year_model}</p>
        <p className="mt-2 text-lg font-bold text-aguiar-red">{formatPriceFromCents(vehicle.price_cents)}</p>
      </Card>
    </Link>
  )
}
