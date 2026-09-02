import { CheckCircleIcon, AlertCircleIcon, ClockIcon } from './icons'
import { anton } from '@/lib/fonts'

interface StockStatsRowProps {
  availableCount: number
  noMarginCount: number
  staleCount: number
  thresholdDays: number
}

export function StockStatsRow({ availableCount, noMarginCount, staleCount, thresholdDays }: StockStatsRowProps) {
  const stats = [
    { label: 'Disponíveis', value: availableCount, Icon: CheckCircleIcon, chip: 'bg-green-50 text-green-700' },
    { label: 'Sem margem', value: noMarginCount, Icon: AlertCircleIcon, chip: 'bg-yellow-100 text-yellow-800' },
    { label: `Parados +${thresholdDays}d`, value: staleCount, Icon: ClockIcon, chip: 'bg-aguiar-red/10 text-aguiar-red' },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
