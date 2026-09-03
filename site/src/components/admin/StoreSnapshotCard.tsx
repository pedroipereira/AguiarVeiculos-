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

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Sua loja agora</h2>
        <p className="text-sm text-support-gray">Investimento no estoque atual</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-support-gray">Valor gasto no estoque</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(snapshot.investedCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Valor de venda do estoque</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(snapshot.listValueCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Lucro esperado</p>
          <p
            className={`${anton.className} text-2xl ${snapshot.expectedProfitCents < 0 ? 'text-aguiar-red' : 'text-green-700'}`}
          >
            {formatPriceFromCents(snapshot.expectedProfitCents)}
          </p>
        </div>
      </div>
    </section>
  )
}
