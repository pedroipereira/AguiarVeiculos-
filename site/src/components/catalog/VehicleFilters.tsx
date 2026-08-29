'use client'

import { useRouter, useSearchParams } from 'next/navigation'

/** The URL carries cents; the inputs show whole reais, which is what buyers type. */
function centsToReais(cents: string | null): string {
  if (!cents) return ''
  const value = Number(cents)
  return Number.isFinite(value) ? String(Math.round(value / 100)) : ''
}

export function VehicleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/estoque?${params.toString()}`)
  }

  function updatePriceParam(key: 'minPrice' | 'maxPrice', reais: string) {
    const value = Number(reais)
    if (!reais || !Number.isFinite(value)) {
      updateParam(key, '')
      return
    }
    updateParam(key, String(Math.round(value * 100)))
  }

  return (
    <div className="mb-8 flex flex-wrap gap-4">
      <input
        aria-label="Filtrar por marca"
        placeholder="Marca"
        defaultValue={searchParams.get('brand') ?? ''}
        onBlur={(e) => updateParam('brand', e.target.value)}
        className="rounded border p-2 text-graphite"
      />
      <input
        aria-label="Filtrar por ano"
        placeholder="Ano"
        defaultValue={searchParams.get('year') ?? ''}
        onBlur={(e) => updateParam('year', e.target.value)}
        className="rounded border p-2 text-graphite"
      />
      <input
        aria-label="Preço mínimo"
        placeholder="Preço mínimo (R$)"
        type="number"
        min={0}
        defaultValue={centsToReais(searchParams.get('minPrice'))}
        onBlur={(e) => updatePriceParam('minPrice', e.target.value)}
        className="rounded border p-2 text-graphite"
      />
      <input
        aria-label="Preço máximo"
        placeholder="Preço máximo (R$)"
        type="number"
        min={0}
        defaultValue={centsToReais(searchParams.get('maxPrice'))}
        onBlur={(e) => updatePriceParam('maxPrice', e.target.value)}
        className="rounded border p-2 text-graphite"
      />
    </div>
  )
}
