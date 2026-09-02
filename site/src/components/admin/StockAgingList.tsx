import Link from 'next/link'
import { formatPriceFromCents } from '@/lib/format'

interface AgingVehicle {
  id: string
  brand: string
  model: string
  version: string | null
  year_model: number
  mileage_km: number
  price_cents: number
  days: number
}

export function StockAgingList({ vehicles }: { vehicles: AgingVehicle[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Carros parados há mais tempo</h2>
          <p className="text-sm text-support-gray">Priorize o giro destes carros</p>
        </div>
        <Link
          href="/admin/veiculos"
          className="shrink-0 rounded-lg border border-support-gray/25 px-4 py-2 text-sm font-bold text-graphite transition-colors hover:border-graphite"
        >
          Ver estoque
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-support-gray">Nenhum veículo disponível no estoque.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-support-gray/10">
          {vehicles.map((vehicle, index) => (
            <li key={vehicle.id} className="flex items-center gap-3 py-3">
              <span className="w-5 shrink-0 text-sm font-bold text-support-gray">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-graphite">
                  {vehicle.brand} {vehicle.model} {vehicle.version}
                </p>
                <p className="text-xs text-support-gray">
                  {vehicle.year_model} · {vehicle.mileage_km.toLocaleString('pt-BR')} km
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-bold text-graphite">{formatPriceFromCents(vehicle.price_cents)}</span>
                <span className="rounded-full bg-card-gray px-2 py-0.5 text-xs font-bold text-support-gray">{vehicle.days}d</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
