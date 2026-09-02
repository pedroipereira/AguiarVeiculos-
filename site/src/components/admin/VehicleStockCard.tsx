import Link from 'next/link'
import { formatPriceFromCents } from '@/lib/format'
import type { Vehicle } from '@/lib/types'
import { calculateEstimatedMarginCents, calculateRealizedMarginCents } from '@/lib/vehicle-costs'
import { daysInStock, hasMarginDefined } from '@/lib/vehicle-stock'

interface VehicleStockCardProps {
  vehicle: Vehicle
  coverImageUrl?: string
  totalCostCents: number
  thresholdDays: number
}

export function VehicleStockCard({ vehicle, coverImageUrl, totalCostCents, thresholdDays }: VehicleStockCardProps) {
  const days = daysInStock(vehicle)
  const isStale = vehicle.status === 'available' && days >= thresholdDays
  const marginDefined = hasMarginDefined(vehicle)
  const marginCents = vehicle.status === 'sold'
    ? calculateRealizedMarginCents(vehicle.sale_price_cents, totalCostCents)
    : calculateEstimatedMarginCents(vehicle.price_cents, totalCostCents)

  return (
    <Link
      href={`/admin/veiculos/${vehicle.id}`}
      className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] bg-support-gray/10">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-support-gray">Sem foto</div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-bold text-white ${isStale ? 'bg-aguiar-red' : 'bg-graphite'}`}>
          {days} {days === 1 ? 'dia' : 'dias'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="font-bold">{vehicle.brand} {vehicle.model} {vehicle.version}</p>
          <p className="text-sm text-support-gray">
            {vehicle.year_model} · {vehicle.mileage_km.toLocaleString('pt-BR')} km · {vehicle.color}
          </p>
        </div>

        <p className="text-sm text-support-gray">Tabela {formatPriceFromCents(vehicle.price_cents)}</p>

        {marginDefined ? (
          <div className="rounded-lg bg-green-50 p-2">
            <div className="flex items-center justify-between text-sm font-bold text-green-700">
              <span>Mínimo à vista {formatPriceFromCents(vehicle.min_sale_price_cents!)}</span>
              <span>-{formatPriceFromCents(vehicle.price_cents - vehicle.min_sale_price_cents!)}</span>
            </div>
            <p className="mt-1 text-xs text-support-gray">
              Custo {formatPriceFromCents(totalCostCents)} · {vehicle.status === 'sold' ? 'Lucro realizado' : 'Lucro'} {formatPriceFromCents(marginCents ?? 0)}
            </p>
          </div>
        ) : (
          <span className="rounded-lg bg-yellow-100 px-3 py-2 text-center text-sm font-bold text-yellow-800">
            Sem margem definida
          </span>
        )}
      </div>
    </Link>
  )
}
