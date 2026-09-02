'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Vehicle } from '@/lib/types'
import { getSalesTimeSeries, type TimeSeriesGranularity } from '@/lib/dashboard'

interface SalesTimeSeriesChartProps {
  vehicles: Vehicle[]
  now?: Date
}

const RANGE_OPTIONS: { granularity: TimeSeriesGranularity; buckets: number; label: string }[] = [
  { granularity: 'day', buckets: 7, label: 'Últimos 7 dias' },
  { granularity: 'week', buckets: 4, label: 'Últimas 4 semanas' },
  { granularity: 'month', buckets: 12, label: 'Últimos 12 meses' },
]

export function SalesTimeSeriesChart({ vehicles, now = new Date() }: SalesTimeSeriesChartProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { granularity, buckets } = RANGE_OPTIONS[selectedIndex]
  const data = getSalesTimeSeries(vehicles, granularity, buckets, now)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Vendas ao longo do tempo</h2>
          <p className="text-sm text-support-gray">Número de vendas por período</p>
        </div>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                index === selectedIndex ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="bucketLabel" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#D32027" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
