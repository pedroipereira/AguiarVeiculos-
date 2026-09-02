'use client'

import { useState } from 'react'
import type { Vehicle } from '@/lib/types'
import { countStockFilters, applyStockFilter, matchesStockSearch, type StockFilter } from '@/lib/vehicle-stock'
import { calculateTotalCostCents } from '@/lib/vehicle-costs'
import { VehicleStockCard } from './VehicleStockCard'

interface VehicleStockGridProps {
  vehicles: Vehicle[]
  coverImageUrls: Record<string, string>
  expenseTotalsCents: Record<string, number>
  thresholdDays: number
}

export function VehicleStockGrid({ vehicles, coverImageUrls, expenseTotalsCents, thresholdDays }: VehicleStockGridProps) {
  const [filter, setFilter] = useState<StockFilter>('all')
  const [search, setSearch] = useState('')

  const counts = countStockFilters(vehicles, thresholdDays)
  const filtered = applyStockFilter(vehicles, filter, thresholdDays).filter((vehicle) => matchesStockSearch(vehicle, search))

  const tabs: { value: StockFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: counts.all },
    { value: 'no_margin', label: 'Sem margem', count: counts.no_margin },
    { value: 'turnover', label: `Girar (+${thresholdDays}d)`, count: counts.turnover },
    { value: 'preparing', label: 'Em preparação', count: counts.preparing },
  ]

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              filter === tab.value ? 'border-graphite bg-graphite text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por marca, modelo, versão ou cor..."
        aria-label="Buscar veículo"
        className="mb-6 w-full max-w-md rounded-full border border-support-gray/25 px-4 py-2.5 text-graphite transition-colors focus:border-aguiar-red focus:outline-none"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((vehicle) => (
          <VehicleStockCard
            key={vehicle.id}
            vehicle={vehicle}
            coverImageUrl={coverImageUrls[vehicle.id]}
            totalCostCents={calculateTotalCostCents(vehicle.acquisition_cost_cents, [
              { amount_cents: expenseTotalsCents[vehicle.id] ?? 0 },
            ])}
            thresholdDays={thresholdDays}
          />
        ))}
      </div>

      {filtered.length === 0 && <p className="mt-6 text-sm text-support-gray">Nenhum veículo encontrado.</p>}
    </div>
  )
}
