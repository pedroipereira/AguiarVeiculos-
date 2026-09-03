'use client'

import { useState } from 'react'
import type { Vehicle } from '@/lib/types'
import { resolveDateRange, getSalesPanelMetrics, type DateRangePreset } from '@/lib/dashboard'
import { formatPriceFromCents } from '@/lib/format'
import { anton } from '@/lib/fonts'
import { VehicleDatePicker } from './VehicleDatePicker'
import { buildPainelPdf } from '@/lib/painel-pdf'

interface SalesPanelProps {
  vehicles: Vehicle[]
  expenseTotals: Record<string, number>
  goal: number | null
  soldCount: number
  now?: Date
}

const PRESETS: { value: Exclude<DateRangePreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
]

export function SalesPanel({ vehicles, expenseTotals, goal, soldCount, now = new Date() }: SalesPanelProps) {
  const [preset, setPreset] = useState<DateRangePreset>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const range =
    preset === 'custom'
      ? resolveDateRange('custom', now, { start: customStart, end: customEnd })
      : resolveDateRange(preset, now)
  const metrics = getSalesPanelMetrics(vehicles, expenseTotals, range)
  const periodLabel = preset === 'custom' ? 'Personalizado' : PRESETS.find((option) => option.value === preset)!.label

  function handleExportPdf() {
    const doc = buildPainelPdf({ goal, soldCount, periodLabel, metrics, vehicles, expenseTotals })
    doc.save(`painel-aguiar-veiculos-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Visão de vendas</h2>
          <p className="text-sm text-support-gray">Acompanhe as vendas do período</p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          className="rounded-full border border-support-gray/25 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-graphite transition-colors hover:border-graphite"
        >
          Exportar PDF
        </button>
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
          <div className="w-40">
            <VehicleDatePicker id="customStart" value={customStart} onChange={setCustomStart} />
          </div>
          <label htmlFor="customEnd" className="text-sm text-support-gray">
            até
          </label>
          <div className="w-40">
            <VehicleDatePicker id="customEnd" value={customEnd} onChange={setCustomEnd} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-support-gray">Lucro</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(metrics.profitCents)}</p>
          <p className="text-xs text-support-gray">
            margem {metrics.marginPercent}% · {metrics.count} {metrics.count === 1 ? 'venda' : 'vendas'} no período
          </p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-support-gray">Faturamento</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{formatPriceFromCents(metrics.revenueCents)}</p>
          <p className="text-xs text-support-gray">Ticket médio {formatPriceFromCents(metrics.averageSaleCents)} por venda</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-support-gray">Vendas</p>
          <p className={`${anton.className} text-2xl text-graphite`}>{metrics.count}</p>
          <p className="text-xs text-support-gray">Período: {periodLabel}</p>
        </div>
      </div>
    </div>
  )
}
