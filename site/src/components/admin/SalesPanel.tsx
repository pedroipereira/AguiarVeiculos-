'use client'

import { useState } from 'react'
import type { Vehicle } from '@/lib/types'
import { resolveDateRange, getSalesPanelMetrics, type DateRangePreset } from '@/lib/dashboard'
import { formatPriceFromCents } from '@/lib/format'
import { anton } from '@/lib/fonts'

interface SalesPanelProps {
  vehicles: Vehicle[]
  expenseTotals: Record<string, number>
  now?: Date
}

const PRESETS: { value: Exclude<DateRangePreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
]

export function SalesPanel({ vehicles, expenseTotals, now = new Date() }: SalesPanelProps) {
  const [preset, setPreset] = useState<DateRangePreset>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const range =
    preset === 'custom'
      ? resolveDateRange('custom', now, { start: customStart, end: customEnd })
      : resolveDateRange(preset, now)
  const metrics = getSalesPanelMetrics(vehicles, expenseTotals, range)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Painel de vendas</h2>
        <p className="text-sm text-support-gray">Acompanhe as vendas do período</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPreset(value)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              preset === value ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreset('custom')}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
            preset === 'custom' ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
          }`}
        >
          Personalizado
        </button>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="customStart" className="text-sm text-support-gray">
            De
          </label>
          <input
            id="customStart"
            type="date"
            value={customStart}
            onChange={(event) => setCustomStart(event.target.value)}
            className="rounded-lg border border-support-gray/25 p-1.5 text-sm text-graphite"
          />
          <label htmlFor="customEnd" className="text-sm text-support-gray">
            até
          </label>
          <input
            id="customEnd"
            type="date"
            value={customEnd}
            onChange={(event) => setCustomEnd(event.target.value)}
            className="rounded-lg border border-support-gray/25 p-1.5 text-sm text-graphite"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-support-gray">Lucro</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(metrics.profitCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Faturamento</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(metrics.revenueCents)}</p>
        </div>
        <div>
          <p className="text-sm text-support-gray">Vendas</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{metrics.count}</p>
        </div>
      </div>
    </section>
  )
}
