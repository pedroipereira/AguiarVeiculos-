import { LeadsIcon, AlertCircleIcon, ClockIcon, CheckCircleIcon } from './icons'
import { anton } from '@/lib/fonts'

interface LeadSummaryCardsProps {
  activeCount: number
  negotiatingCount: number
  overdueCount: number
  soldCount: number
}

export function LeadSummaryCards({ activeCount, negotiatingCount, overdueCount, soldCount }: LeadSummaryCardsProps) {
  const stats = [
    { label: 'Clientes ativos', value: activeCount, Icon: LeadsIcon, chip: 'bg-support-gray/10 text-support-gray' },
    { label: 'Em negociação', value: negotiatingCount, Icon: AlertCircleIcon, chip: 'bg-yellow-100 text-yellow-800' },
    { label: 'Retornos atrasados', value: overdueCount, Icon: ClockIcon, chip: 'bg-aguiar-red/10 text-aguiar-red' },
    { label: 'Vendas no mês', value: soldCount, Icon: CheckCircleIcon, chip: 'bg-green-50 text-green-700' },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, Icon, chip }) => (
        <div key={label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${chip}`}>
            <Icon />
          </span>
          <div>
            <p className="text-sm text-support-gray">{label}</p>
            <p className={`${anton.className} text-3xl leading-none text-graphite`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
