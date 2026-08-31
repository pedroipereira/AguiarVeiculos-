'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { VehiclePublic } from '@/lib/types'
import { VehicleInstantSearch } from './VehicleInstantSearch'

const SORT_OPTIONS = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Menor preço', value: 'price_asc' },
  { label: 'Maior preço', value: 'price_desc' },
  { label: 'Menor quilometragem', value: 'mileage_asc' },
]

export interface VehicleSearchSortProps {
  resultCount: number
  mobileFiltersOpen: boolean
  onToggleMobileFilters: () => void
  allVehicles: VehiclePublic[]
  allVehicleImageUrls: Record<string, string>
  brandNames: string[]
}

export function VehicleSearchSort({
  resultCount,
  mobileFiltersOpen,
  onToggleMobileFilters,
  allVehicles,
  allVehicleImageUrls,
  brandNames,
}: VehicleSearchSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/estoque?${params.toString()}`)
  }

  const activeFilterCount = [
    searchParams.get('brands'),
    searchParams.get('maxPrice'),
    searchParams.get('minYear'),
    searchParams.get('maxMileage'),
    searchParams.get('transmission'),
    searchParams.get('fuelType'),
  ].filter(Boolean).length

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-support-gray/15 bg-white p-4 shadow-sm">
      <VehicleInstantSearch vehicles={allVehicles} imageUrls={allVehicleImageUrls} brands={brandNames} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileFilters}
          aria-expanded={mobileFiltersOpen}
          aria-controls="mobile-filters-panel"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-support-gray/20 px-3.5 py-2 text-sm font-bold text-graphite transition-colors hover:border-aguiar-red hover:text-aguiar-red lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-aguiar-red px-1 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <p className="whitespace-nowrap text-sm text-support-gray">
          {resultCount} {resultCount === 1 ? 'veículo' : 'veículos'}
        </p>

        <div className="relative ml-auto">
          <select
            aria-label="Ordenar por"
            value={searchParams.get('sort') ?? 'recent'}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="appearance-none rounded-full border border-support-gray/20 py-2.5 pl-4 pr-9 text-sm font-bold text-graphite transition-colors focus:border-aguiar-red focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-support-gray"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  )
}
