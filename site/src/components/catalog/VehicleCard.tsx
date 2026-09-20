import Link from 'next/link'
import type { VehiclePublic } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'

interface VehicleCardProps {
  vehicle: VehiclePublic
  imageUrl?: string
  photoCount?: number
  /** `dark` is a thin-bordered panel for the black home page; the light pages keep the white card. */
  surface?: 'light' | 'dark'
}

export function VehicleCard({ vehicle, imageUrl, photoCount, surface = 'light' }: VehicleCardProps) {
  const dark = surface === 'dark'
  const label = [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(' ')

  return (
    <Link
      href={`/estoque/${vehicle.slug}`}
      className={`group block overflow-hidden rounded-xl border transition-all hover:-translate-y-1 ${
        dark
          ? 'border-white/10 bg-white/[0.04] text-white hover:border-white/25'
          : 'border-support-gray/10 bg-white text-graphite shadow-sm hover:shadow-lg'
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            role="presentation"
            data-testid="vehicle-card-placeholder"
            className="h-full w-full bg-support-gray/20"
          />
        )}
        {photoCount != null && photoCount > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-graphite/60 px-2 py-1 text-xs font-bold text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h3l2-2h6l2 2h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            {photoCount}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-sm font-bold sm:text-base">{label}</p>
        <p className={`mt-1 text-xs sm:text-sm ${dark ? 'text-white/85' : 'text-support-gray'}`}>
          {vehicle.year_model} • {vehicle.mileage_km.toLocaleString('pt-BR')} km
        </p>
        <div
          className={`mt-3 flex flex-col gap-1 border-t pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 ${
            dark ? 'border-white/10' : 'border-support-gray/20'
          }`}
        >
          <p className={`text-base font-bold sm:text-lg ${dark ? 'text-white' : 'text-graphite'}`}>{formatPriceFromCents(vehicle.price_cents)}</p>
          <span className={`text-xs font-bold sm:text-sm ${dark ? 'text-aguiar-red-light' : 'text-aguiar-red'}`}>Ver detalhes ›</span>
        </div>
      </div>
    </Link>
  )
}
