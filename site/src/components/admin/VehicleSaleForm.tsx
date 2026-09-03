'use client'

import { useState, type FormEvent } from 'react'
import type { Lead } from '@/lib/types'
import { adminMarkVehicleSold } from '@/app/actions/vehicles'
import { VehicleDatePicker } from './VehicleDatePicker'

interface VehicleSaleFormProps {
  vehicleId: string
  leads: Lead[]
  defaultBuyerLeadId?: string
  onCancel: () => void
  onSaved: () => void
}

const inputClass =
  'h-11 rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'

export function VehicleSaleForm({ vehicleId, leads, defaultBuyerLeadId, onCancel, onSaved }: VehicleSaleFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [soldAt, setSoldAt] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!soldAt) {
      setError('Escolha a data da venda.')
      return
    }
    const formData = new FormData(event.currentTarget)
    const salePriceReais = String(formData.get('salePriceReais') || '')
    const buyerLeadId = String(formData.get('buyerLeadId') || '')

    setSaving(true)
    try {
      await adminMarkVehicleSold(vehicleId, {
        salePriceCents: Math.round(Number(salePriceReais) * 100),
        soldAt,
        buyerLeadId: buyerLeadId || undefined,
      })
      onSaved()
    } catch {
      setError('Não foi possível registrar a venda. Confira os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg border border-support-gray/25 p-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={`salePriceReais-${vehicleId}`} className="text-sm font-bold">Preço de venda (em reais)</label>
        <input id={`salePriceReais-${vehicleId}`} name="salePriceReais" type="number" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`soldAt-${vehicleId}`} className="text-sm font-bold">Data da venda</label>
        <VehicleDatePicker id={`soldAt-${vehicleId}`} value={soldAt} onChange={setSoldAt} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`buyerLeadId-${vehicleId}`} className="text-sm font-bold">Comprador (opcional)</label>
        <select id={`buyerLeadId-${vehicleId}`} name="buyerLeadId" defaultValue={defaultBuyerLeadId ?? ''} className={inputClass}>
          <option value="">Sem comprador vinculado</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>{lead.name} — {lead.phone}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-aguiar-red">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-graphite px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-graphite/80 disabled:opacity-50"
        >
          Confirmar venda
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-support-gray/25 px-4 py-2 text-sm font-bold text-graphite hover:border-graphite"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
