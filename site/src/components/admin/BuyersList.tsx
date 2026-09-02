import type { Lead, Vehicle } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'
import { formatIsoDate } from '@/lib/lead-kanban'

interface BuyersListProps {
  buyers: { lead: Lead; vehicle: Vehicle }[]
}

export function BuyersList({ buyers }: BuyersListProps) {
  if (buyers.length === 0) {
    return <p className="text-support-gray">Nenhuma venda neste mês.</p>
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-support-gray">
          <th className="py-2">Cliente</th>
          <th>Telefone</th>
          <th>Veículo</th>
          <th>Valor da venda</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {buyers.map(({ lead, vehicle }) => (
          <tr key={lead.id} className="border-b border-support-gray/40">
            <td className="py-2">{lead.name}</td>
            <td>{lead.phone}</td>
            <td>{vehicle.brand} {vehicle.model} {vehicle.version ?? ''}</td>
            <td>{formatPriceFromCents(vehicle.sale_price_cents ?? 0)}</td>
            <td>{vehicle.sold_at ? formatIsoDate(vehicle.sold_at) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
