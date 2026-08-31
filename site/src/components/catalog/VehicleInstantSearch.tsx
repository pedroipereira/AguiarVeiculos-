'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { VehiclePublic } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'

export interface VehicleInstantSearchProps {
  vehicles: VehiclePublic[]
  imageUrls: Record<string, string>
  brands: string[]
}

function matchesQuery(vehicle: VehiclePublic, query: string): boolean {
  const haystack = [vehicle.brand, vehicle.model, vehicle.version, `${vehicle.year_model}`]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.trim().toLowerCase())
}

export function VehicleInstantSearch({ vehicles, imageUrls, brands }: VehicleInstantSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function close() {
    setOpen(false)
    setQuery('')
    setSelectedBrand('')
  }

  const results = vehicles.filter(
    (vehicle) => (!selectedBrand || vehicle.brand === selectedBrand) && matchesQuery(vehicle, query),
  )

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-support-gray"
      >
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="m21 21-4.3-4.3" />
      </svg>
      <input
        aria-label="Buscar marca ou modelo"
        placeholder="Buscar marca ou modelo..."
        onFocus={() => setOpen(true)}
        readOnly
        value=""
        className="w-full cursor-pointer rounded-full bg-support-gray/5 py-3 pl-11 pr-4 text-graphite transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-aguiar-red/30"
      />

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white text-graphite">
          <div className="flex items-center gap-3 border-b border-support-gray/15 px-4 py-4 sm:px-8">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-support-gray"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m21 21-4.3-4.3" />
            </svg>
            <input
              autoFocus
              aria-label="Buscar por marca, modelo ou ano"
              placeholder="Buscar por marca, modelo ou ano..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-lg text-graphite placeholder:text-support-gray focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-support-gray/20 text-graphite transition-colors hover:bg-support-gray/10"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Fechar busca"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-support-gray/20 text-graphite transition-colors hover:bg-support-gray/10"
            >
              ✕
            </button>
          </div>

          {brands.length > 0 && (
            <div className="flex gap-2 overflow-x-auto border-b border-support-gray/15 px-4 py-3 sm:px-8">
              {brands.map((brand) => {
                const active = selectedBrand === brand
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(active ? '' : brand)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                      active
                        ? 'bg-aguiar-red text-white'
                        : 'border border-support-gray/25 text-graphite hover:border-aguiar-red hover:text-aguiar-red'
                    }`}
                  >
                    {brand}
                  </button>
                )
              })}
            </div>
          )}

          <p className="px-4 pt-4 text-xs font-bold uppercase tracking-widest text-support-gray sm:px-8">
            {results.length} {results.length === 1 ? 'veículo no estoque' : 'veículos no estoque'}
          </p>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8">
            {results.length === 0 ? (
              <p className="text-support-gray">Nenhum veículo encontrado.</p>
            ) : (
              <ul className="flex flex-col">
                {results.map((vehicle) => {
                  const label = [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(' ')
                  return (
                    <li key={vehicle.id} className="border-b border-support-gray/10 last:border-b-0">
                      {/*
                        No onClick to close the overlay here: closing it eagerly would
                        unmount it before the route transition finishes, flashing the
                        plain /estoque page underneath. Letting the navigation unmount
                        this whole component naturally avoids that flash.
                      */}
                      <Link
                        href={`/estoque/${vehicle.slug}`}
                        className="flex items-center gap-4 py-3 transition-colors hover:bg-support-gray/5"
                      >
                        {imageUrls[vehicle.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrls[vehicle.id]}
                            alt={label}
                            className="h-16 w-20 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-16 w-20 shrink-0 rounded-md bg-support-gray/20" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{label}</p>
                          <p className="text-sm text-support-gray">
                            {vehicle.year_model} • {vehicle.mileage_km.toLocaleString('pt-BR')} km
                          </p>
                        </div>
                        <p className="shrink-0 font-bold">{formatPriceFromCents(vehicle.price_cents)}</p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
