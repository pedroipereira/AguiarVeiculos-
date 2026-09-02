'use client'

import { useEffect, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Lead, LeadStage } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { LEAD_STAGES, LEAD_STAGE_LABELS, buildWhatsAppLink, formatIsoDate } from '@/lib/lead-kanban'
import { formatPriceFromCents } from '@/lib/format'
import { adminDeleteLead } from '@/app/actions/leads'
import { LeadQuickAddModal } from './LeadQuickAddModal'

interface LeadCardProps {
  lead: Lead
  vehicles: VehicleOption[]
  onMoveToStage: (stage: LeadStage) => void
}

export function LeadCard({ lead, vehicles, onMoveToStage }: LeadCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // The whole card is the drag handle — dnd-kit's PointerSensor (configured
  // with an activation distance in LeadKanbanBoard) only starts a drag after
  // the pointer moves past a threshold, so a plain click on a button inside
  // the card still fires normally.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })

  // Same outside-click pattern as VehicleDatePicker: closes the menu on any
  // click elsewhere, without an invisible full-screen overlay that would
  // swallow the first click on a different element.
  useEffect(() => {
    if (!menuOpen) return
    function handleOutsideMouseDown(event: MouseEvent) {
      const target = event.target as Node
      if (menuButtonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideMouseDown)
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown)
  }, [menuOpen])

  const vehicle = vehicles.find((option) => option.id === lead.vehicle_id)
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{lead.name}</p>
        <div className="relative">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Mais opções"
            className="rounded p-1 text-support-gray hover:bg-support-gray/10 hover:text-graphite"
          >
            ⋯
          </button>
          {menuOpen && (
            <div ref={menuRef} className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-support-gray/25 bg-white p-1 shadow-lg">
              <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-support-gray">Mover para</p>
              {LEAD_STAGES.filter((stage) => stage !== lead.stage).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => { setMenuOpen(false); onMoveToStage(stage) }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm text-graphite hover:bg-support-gray/10"
                >
                  {LEAD_STAGE_LABELS[stage]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); if (window.confirm('Excluir este lead?')) adminDeleteLead(lead.id) }}
                className="mt-1 block w-full rounded border-t border-support-gray/15 px-2 py-1.5 text-left text-sm text-aguiar-red hover:bg-red-50"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-support-gray">{lead.phone}</p>

      {vehicle && (
        <p className="text-sm text-graphite">
          {vehicle.brand} {vehicle.model} {vehicle.version ?? ''} · {formatPriceFromCents(vehicle.price_cents)}
        </p>
      )}

      {lead.notes && <p className="text-sm text-support-gray">{lead.notes}</p>}

      {(lead.first_contact_at || lead.store_visit_at || lead.scheduled_visit_date) && (
        <div className="flex flex-col gap-0.5 text-xs text-support-gray">
          {lead.first_contact_at && <span>Primeiro contato: {formatIsoDate(lead.first_contact_at)}</span>}
          {lead.store_visit_at && <span>Veio na loja: {formatIsoDate(lead.store_visit_at)}</span>}
          {lead.scheduled_visit_date && (
            <span>
              Visita marcada: {formatIsoDate(lead.scheduled_visit_date)}
              {lead.scheduled_visit_time ? ` às ${lead.scheduled_visit_time.slice(0, 5)}` : ''}
            </span>
          )}
        </div>
      )}

      <div className="mt-1 flex gap-2 border-t border-support-gray/15 pt-2">
        <a
          href={buildWhatsAppLink(lead.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-lg border border-support-gray/25 px-3 py-1.5 text-center text-xs font-bold text-graphite hover:border-graphite"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="flex-1 rounded-lg border border-support-gray/25 px-3 py-1.5 text-center text-xs font-bold text-graphite hover:border-graphite"
        >
          Editar
        </button>
      </div>

      {showEditModal && (
        <LeadQuickAddModal
          vehicles={vehicles}
          lead={lead}
          title="Editar lead"
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}
