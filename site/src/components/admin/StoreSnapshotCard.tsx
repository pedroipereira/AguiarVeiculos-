import { getStoreSnapshot } from '@/lib/dashboard'
import type { Vehicle } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'
import { anton } from '@/lib/fonts'

interface StoreSnapshotCardProps {
  vehicles: Vehicle[]
  expenseTotals: Record<string, number>
}

export function StoreSnapshotCard({ vehicles, expenseTotals }: StoreSnapshotCardProps) {
  const snapshot = getStoreSnapshot(vehicles, expenseTotals)

  const carLabel = snapshot.vehicleCount === 1 ? 'carro' : 'carros'
  const articleLabel = snapshot.vehicleCount === 1 ? 'no' : 'nos'

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <p className="text-base text-support-gray">Investido no estoque</p>
        <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(snapshot.investedCents)}</p>
        <p className="text-xs text-support-gray">
          investido {articleLabel} {snapshot.vehicleCount} {carLabel} em estoque
        </p>
      </div>
      <div>
        <p className="text-base text-support-gray">Valor de venda do estoque</p>
        <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(snapshot.listValueCents)}</p>
      </div>
      <div>
        <p className="text-base text-support-gray">Lucro esperado</p>
        <p
          className={`${anton.className} text-2xl ${snapshot.expectedProfitCents < 0 ? 'text-aguiar-red' : 'text-green-700'}`}
        >
          {formatPriceFromCents(snapshot.expectedProfitCents)}
        </p>
        <p className="text-xs text-support-gray">se vender na margem atual</p>
      </div>
    </section>
  )
}
