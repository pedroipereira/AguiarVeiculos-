'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function VehicleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/estoque?${params.toString()}`)
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
    </div>
  )
}
