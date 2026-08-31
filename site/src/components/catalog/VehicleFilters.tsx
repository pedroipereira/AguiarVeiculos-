'use client'

import { useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatPriceFromCents } from '@/lib/format'
import type { VehicleBrandFacet } from '@/lib/queries/vehicles'

const YEAR_MIN = 1995
const YEAR_MAX = new Date().getFullYear()
const PRICE_MAX_REAIS = 1000000

export interface VehicleFiltersProps {
  brands: VehicleBrandFacet[]
  minPriceCents: number
  mileageRangeKm: { min: number; max: number }
  transmissions: string[]
  fuelTypes: string[]
  resultCount: number
  /** Controls the collapsible panel on mobile; always visible at the `lg` breakpoint regardless. */
  mobileOpen: boolean
}

const SLIDER_CLASS =
  'h-2 w-full cursor-pointer appearance-none rounded-full bg-support-gray/20 accent-aguiar-red ' +
  '[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-aguiar-red [&::-webkit-slider-thumb]:shadow-sm ' +
  '[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-aguiar-red'

function CollapsibleSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-support-gray/20 py-3 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between text-base font-bold transition-colors hover:text-aguiar-red"
        aria-expanded={open}
      >
        {title}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className={`h-4 w-4 text-support-gray transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

function PillToggle({
  ariaLabel,
  options,
  selected,
  onSelect,
}: {
  ariaLabel: string
  options: string[]
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(active ? '' : option)}
            aria-pressed={active}
            className={`rounded-full px-4 py-1.5 text-base font-bold transition-colors ${
              active
                ? 'bg-aguiar-red text-white'
                : 'border border-support-gray/25 text-graphite hover:border-aguiar-red hover:text-aguiar-red'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export function VehicleFilters({
  brands,
  minPriceCents,
  mileageRangeKm,
  transmissions,
  fuelTypes,
  resultCount,
  mobileOpen,
}: VehicleFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const minPriceReais = Math.round(minPriceCents / 100)
  const selectedBrands = (searchParams.get('brands') ?? '').split(',').filter(Boolean)
  const currentMaxPriceReais = searchParams.get('maxPrice')
    ? Math.round(Number(searchParams.get('maxPrice')) / 100)
    : PRICE_MAX_REAIS
  const currentMinYear = searchParams.get('minYear') ? Number(searchParams.get('minYear')) : YEAR_MIN
  const currentMaxMileage = searchParams.get('maxMileage') ? Number(searchParams.get('maxMileage')) : mileageRangeKm.max

  const [priceDraft, setPriceDraft] = useState(currentMaxPriceReais)
  const [yearDraft, setYearDraft] = useState(currentMinYear)
  const [mileageDraft, setMileageDraft] = useState(currentMaxMileage)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/estoque?${params.toString()}`)
  }

  function toggleBrand(brand: string) {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand]
    updateParam('brands', next.join(','))
  }

  function commitPrice(reais: number) {
    updateParam('maxPrice', reais >= PRICE_MAX_REAIS ? '' : String(Math.round(reais * 100)))
  }

  function commitYear(year: number) {
    updateParam('minYear', year <= YEAR_MIN ? '' : String(year))
  }

  function commitMileage(km: number) {
    updateParam('maxMileage', km >= mileageRangeKm.max ? '' : String(km))
  }

  function clearFilters() {
    router.push('/estoque')
  }

  return (
    <div
      className={`rounded-xl border border-support-gray/15 bg-white text-graphite shadow-sm lg:block lg:p-5 ${
        mobileOpen ? 'block p-3' : 'hidden'
      }`}
    >
      <p className="mb-1 hidden text-xl font-bold lg:block">Filtros</p>

      <div id="mobile-filters-panel" className={mobileOpen ? 'block' : 'hidden lg:mt-1 lg:block'}>
      <CollapsibleSection title="Marca">
        <div className="max-h-64 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            {brands.map((item) => (
              <div
                key={item.brand}
                className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-base transition-colors hover:bg-support-gray/5"
              >
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(item.brand)}
                    onChange={() => toggleBrand(item.brand)}
                    className="h-4 w-4 accent-aguiar-red"
                  />
                  {item.brand}
                </label>
                <span className="text-sm text-support-gray">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Preço">
        <input
          aria-label="Preço máximo"
          type="range"
          min={minPriceReais}
          max={PRICE_MAX_REAIS}
          value={priceDraft}
          onChange={(e) => setPriceDraft(Number(e.target.value))}
          onPointerUp={(e) => commitPrice(Number((e.target as HTMLInputElement).value))}
          onBlur={(e) => commitPrice(Number(e.target.value))}
          className={SLIDER_CLASS}
        />
        <p className="mt-2 text-base font-bold">
          {priceDraft >= PRICE_MAX_REAIS ? 'Até sem limite' : `Até ${formatPriceFromCents(priceDraft * 100)}`}
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Ano">
        <input
          aria-label="Ano mínimo"
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={yearDraft}
          onChange={(e) => setYearDraft(Number(e.target.value))}
          onPointerUp={(e) => commitYear(Number((e.target as HTMLInputElement).value))}
          onBlur={(e) => commitYear(Number(e.target.value))}
          className={SLIDER_CLASS}
        />
        <p className="mt-2 text-base font-bold">A partir de {yearDraft}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Quilometragem">
        <input
          aria-label="Quilometragem máxima"
          type="range"
          min={mileageRangeKm.min}
          max={mileageRangeKm.max}
          value={mileageDraft}
          onChange={(e) => setMileageDraft(Number(e.target.value))}
          onPointerUp={(e) => commitMileage(Number((e.target as HTMLInputElement).value))}
          onBlur={(e) => commitMileage(Number(e.target.value))}
          className={SLIDER_CLASS}
        />
        <p className="mt-2 text-base font-bold">
          {mileageDraft >= mileageRangeKm.max ? 'Sem limite' : `Até ${mileageDraft.toLocaleString('pt-BR')} km`}
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Câmbio">
        <PillToggle
          ariaLabel="Filtrar por câmbio"
          options={transmissions}
          selected={searchParams.get('transmission') ?? ''}
          onSelect={(value) => updateParam('transmission', value)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Combustível">
        <PillToggle
          ariaLabel="Filtrar por combustível"
          options={fuelTypes}
          selected={searchParams.get('fuelType') ?? ''}
          onSelect={(value) => updateParam('fuelType', value)}
        />
      </CollapsibleSection>

      <div className="mt-4 rounded-full bg-aguiar-red px-5 py-2.5 text-center text-base font-bold text-white shadow-sm">
        Ver {resultCount} {resultCount === 1 ? 'veículo' : 'veículos'}
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="mt-2 w-full text-center text-base text-support-gray transition-colors hover:text-aguiar-red"
      >
        Limpar filtros
      </button>
      </div>
    </div>
  )
}
