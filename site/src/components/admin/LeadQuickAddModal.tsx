'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { adminCreateManualLead, adminUpdateLead } from '@/app/actions/leads'
import type { Lead, LeadStage } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { VehicleDatePicker } from './VehicleDatePicker'

interface LeadQuickAddModalProps {
  vehicles: VehicleOption[]
  onClose: () => void
  lead?: Lead
  defaultVehicleId?: string
  defaultStage?: LeadStage
  title?: string
}

const STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: 'novo', label: 'Lead novo' },
  { value: 'visita_marcada', label: 'Visita marcada' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'ligar_de_volta', label: 'Ligar de volta' },
  { value: 'vendeu', label: 'Vendeu' },
  { value: 'nao_comprou', label: 'Não comprou' },
]

const inputClass =
  'h-11 rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const textareaClass =
  'rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const labelClass = 'text-sm font-bold'
const sectionLabelClass = 'text-xs font-bold uppercase tracking-wide text-support-gray'
const primaryButtonClass =
  'flex-1 rounded-lg bg-aguiar-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass =
  'flex-1 rounded-lg border border-support-gray/25 px-5 py-3 text-sm font-bold text-graphite transition-colors hover:border-graphite'

export function LeadQuickAddModal({
  vehicles, onClose, lead, defaultVehicleId = '', defaultStage = 'novo', title,
}: LeadQuickAddModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [firstContactAt, setFirstContactAt] = useState(lead?.first_contact_at ?? '')
  const [storeVisitAt, setStoreVisitAt] = useState(lead?.store_visit_at ?? '')
  const [scheduledVisitDate, setScheduledVisitDate] = useState(lead?.scheduled_visit_date ?? '')

  const modalTitle = title ?? (lead ? 'Editar lead' : 'Novo lead')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    const input = {
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      vehicleId: String(formData.get('vehicleId') || '') || undefined,
      stage: (String(formData.get('stage') || '') || undefined) as LeadStage | undefined,
      notes: String(formData.get('notes') || '') || undefined,
      firstContactAt: firstContactAt || undefined,
      storeVisitAt: storeVisitAt || undefined,
      scheduledVisitDate: scheduledVisitDate || undefined,
      scheduledVisitTime: String(formData.get('scheduledVisitTime') || '') || undefined,
    }

    setSaving(true)
    try {
      if (lead) {
        await adminUpdateLead(lead.id, input)
      } else {
        await adminCreateManualLead(input)
      }
      router.refresh()
      onClose()
    } catch {
      setError('Não foi possível salvar o lead. Confira os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 p-4" role="dialog" aria-modal="true" aria-label={modalTitle}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-support-gray hover:text-graphite">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className={sectionLabelClass}>Contato</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-name" className={labelClass}>Nome</label>
                <input id="lead-name" name="name" autoComplete="name" placeholder="Ex.: Maria Silva" defaultValue={lead?.name} required className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-phone" className={labelClass}>Telefone</label>
                <input id="lead-phone" name="phone" type="tel" autoComplete="tel" placeholder="(98) 99999-9999" defaultValue={lead?.phone} required className={inputClass} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-support-gray/15 pt-5">
            <p className={sectionLabelClass}>Veículo e funil</p>
            <div className="flex flex-col gap-1">
              <label htmlFor="lead-vehicle" className={labelClass}>Veículo de interesse (opcional)</label>
              <select id="lead-vehicle" name="vehicleId" defaultValue={lead?.vehicle_id ?? defaultVehicleId} className={inputClass}>
                <option value="">Sem veículo vinculado</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} {vehicle.version ?? ''} - {formatPriceFromCents(vehicle.price_cents)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="lead-stage" className={labelClass}>Estágio no funil</label>
              <select id="lead-stage" name="stage" defaultValue={lead?.stage ?? defaultStage} className={inputClass}>
                {STAGE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.value === 'vendeu' && !!lead?.vehicle_id && lead.stage !== 'vendeu'}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-support-gray/15 pt-5">
            <p className={sectionLabelClass}>Datas (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-first-contact" className={labelClass}>Primeiro contato</label>
                <VehicleDatePicker id="lead-first-contact" value={firstContactAt} onChange={setFirstContactAt} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-store-visit" className={labelClass}>Veio na loja</label>
                <VehicleDatePicker id="lead-store-visit" value={storeVisitAt} onChange={setStoreVisitAt} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-scheduled-date" className={labelClass}>Visita marcada</label>
                <VehicleDatePicker id="lead-scheduled-date" value={scheduledVisitDate} onChange={setScheduledVisitDate} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-scheduled-time" className={labelClass}>Hora da visita</label>
                <input id="lead-scheduled-time" name="scheduledVisitTime" type="time" defaultValue={lead?.scheduled_visit_time ?? ''} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-support-gray/15 pt-5">
            <label htmlFor="lead-notes" className={labelClass}>Observações</label>
            <textarea
              id="lead-notes"
              name="notes"
              rows={3}
              defaultValue={lead?.notes ?? ''}
              placeholder="Anotações sobre o cliente ou a negociação"
              className={textareaClass}
            />
          </div>

          {error && <p className="text-sm text-aguiar-red">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? 'Salvando...' : 'Salvar lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
