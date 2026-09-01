'use client'

import { useEffect, useRef, useState } from 'react'
import { formatPriceFromCents } from '@/lib/format'

export interface FipeSelection {
  brandCode: string
  modelCode: string
  yearCode: string
  valueCents: number
  fetchedAt: string
}

interface FipeOption { code: string; name: string }

interface VehicleFipeSectionProps {
  initialValueCents?: number | null
  initialFetchedAt?: string | null
  onSelect: (selection: FipeSelection) => void
}

const inputClass =
  'rounded-lg border border-support-gray/25 p-2 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'

export function VehicleFipeSection({ initialValueCents, initialFetchedAt, onSelect }: VehicleFipeSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [brands, setBrands] = useState<FipeOption[]>([])
  const [models, setModels] = useState<FipeOption[]>([])
  const [years, setYears] = useState<FipeOption[]>([])
  const [brandCode, setBrandCode] = useState('')
  const [modelCode, setModelCode] = useState('')
  const [valueCents, setValueCents] = useState<number | null | undefined>(initialValueCents)
  const [fetchedAt, setFetchedAt] = useState<string | null | undefined>(initialFetchedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Request-token guards: each cascading fetch (modelos/anos/valor) captures the
  // token current at request time and only applies its response if that token is
  // still the latest when the response arrives. This discards stale responses
  // from a superseded selection instead of letting them clobber newer state.
  const modelsRequestRef = useRef(0)
  const yearsRequestRef = useRef(0)
  const valueRequestRef = useRef(0)

  useEffect(() => {
    if (!expanded || brands.length > 0) return
    setLoading(true)
    setError(null)
    fetch('/api/admin/fipe/marcas')
      .then((response) => response.json())
      .then((data) => setBrands(data))
      .catch(() => setError('Não foi possível carregar as marcas da FIPE.'))
      .finally(() => setLoading(false))
  }, [expanded, brands.length])

  function selectBrand(code: string) {
    setBrandCode(code)
    setModelCode('')
    setModels([])
    setYears([])
    const requestId = ++modelsRequestRef.current
    if (!code) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/fipe/modelos?marca=${encodeURIComponent(code)}`)
      .then((response) => response.json())
      .then((data) => {
        if (modelsRequestRef.current !== requestId) return
        setModels(data)
      })
      .catch(() => {
        if (modelsRequestRef.current !== requestId) return
        setError('Não foi possível carregar os modelos da FIPE.')
      })
      .finally(() => {
        if (modelsRequestRef.current !== requestId) return
        setLoading(false)
      })
  }

  function selectModel(code: string) {
    setModelCode(code)
    setYears([])
    const requestId = ++yearsRequestRef.current
    if (!code) return
    setLoading(true)
    setError(null)
    fetch(`/api/admin/fipe/anos?marca=${encodeURIComponent(brandCode)}&modelo=${encodeURIComponent(code)}`)
      .then((response) => response.json())
      .then((data) => {
        if (yearsRequestRef.current !== requestId) return
        setYears(data)
      })
      .catch(() => {
        if (yearsRequestRef.current !== requestId) return
        setError('Não foi possível carregar os anos da FIPE.')
      })
      .finally(() => {
        if (yearsRequestRef.current !== requestId) return
        setLoading(false)
      })
  }

  async function selectYear(code: string) {
    if (!code) return
    const requestId = ++valueRequestRef.current
    setError(null)
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/fipe/valor?marca=${encodeURIComponent(brandCode)}&modelo=${encodeURIComponent(modelCode)}&ano=${encodeURIComponent(code)}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (valueRequestRef.current !== requestId) return
      const nowIso = new Date().toISOString()
      setValueCents(data.valueCents)
      setFetchedAt(nowIso)
      onSelect({ brandCode, modelCode, yearCode: code, valueCents: data.valueCents, fetchedAt: nowIso })
    } catch {
      if (valueRequestRef.current !== requestId) return
      setError('Não foi possível consultar o preço FIPE.')
    } finally {
      if (valueRequestRef.current === requestId) setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-support-gray/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Referência FIPE</h3>
        <button type="button" onClick={() => setExpanded(true)} className="text-sm font-bold text-aguiar-red">
          Buscar na FIPE
        </button>
      </div>

      {valueCents != null && (
        <p className="text-sm text-support-gray">
          Último valor: {formatPriceFromCents(valueCents)}
          {fetchedAt ? ` · consultado em ${new Date(fetchedAt).toLocaleDateString('pt-BR')}` : ''}
        </p>
      )}

      {expanded && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fipeBrand" className="text-xs font-bold">Marca FIPE</label>
            <select id="fipeBrand" value={brandCode} onChange={(e) => selectBrand(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {brands.map((brand) => <option key={brand.code} value={brand.code}>{brand.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fipeModel" className="text-xs font-bold">Modelo FIPE</label>
            <select id="fipeModel" value={modelCode} onChange={(e) => selectModel(e.target.value)} disabled={!brandCode} className={inputClass}>
              <option value="">Selecione</option>
              {models.map((model) => <option key={model.code} value={model.code}>{model.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="fipeYear" className="text-xs font-bold">Ano FIPE</label>
            <select id="fipeYear" onChange={(e) => selectYear(e.target.value)} disabled={!modelCode} className={inputClass}>
              <option value="">Selecione</option>
              {years.map((year) => <option key={year.code} value={year.code}>{year.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading && <p className="text-xs text-support-gray">Consultando FIPE…</p>}
      {error && <p className="text-sm text-aguiar-red">{error}</p>}
    </div>
  )
}
