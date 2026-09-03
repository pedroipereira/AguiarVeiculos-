'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import type { Lead, LeadStage } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { LEAD_STAGES, LEAD_STAGE_LABELS, LEAD_STAGE_ACCENTS, groupLeadsByStage, requiresSaleCompletion } from '@/lib/lead-kanban'
import { adminUpdateLeadStage } from '@/app/actions/leads'
import { LeadCard } from './LeadCard'
import { VehicleSaleForm } from './VehicleSaleForm'

interface LeadKanbanBoardProps {
  leads: Lead[]
  vehicles: VehicleOption[]
}

interface LeadKanbanColumnProps {
  stage: LeadStage
  leads: Lead[]
  vehicles: VehicleOption[]
  onMoveToStage: (lead: Lead, stage: LeadStage) => void
}

function LeadKanbanColumn({ stage, leads, vehicles, onMoveToStage }: LeadKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const accent = LEAD_STAGE_ACCENTS[stage]

  return (
    <div
      ref={setNodeRef}
      className={`flex w-56 shrink-0 flex-col gap-3 rounded-xl p-3 ${isOver ? 'bg-card-gray' : 'bg-card-gray/50'}`}
    >
      <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${accent.headerBg}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wide ${accent.headerText}`}>{LEAD_STAGE_LABELS[stage]}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-support-gray">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} vehicles={vehicles} onMoveToStage={(target) => onMoveToStage(lead, target)} />
        ))}
      </div>
    </div>
  )
}

export function LeadKanbanBoard({ leads, vehicles }: LeadKanbanBoardProps) {
  const [saleFormLead, setSaleFormLead] = useState<Lead | null>(null)
  const [saleStageError, setSaleStageError] = useState<string | null>(null)
  // A small activation distance lets a plain click on a card's buttons pass
  // through as a click instead of being swallowed as a (zero-distance) drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  // Moving a card waits on a full server round-trip (the action's
  // revalidatePath, then Next re-fetching this page's leads) before the
  // prop-driven `leads` reflects the new stage — without this, that round
  // trip reads as a multi-second delay before the card visually moves.
  // useOptimistic shows the move immediately and reconciles with the real
  // `leads` prop once the server confirms (or silently reverts on failure).
  const [optimisticLeads, setOptimisticLeadStage] = useOptimistic(
    leads,
    (state, update: { id: string; stage: LeadStage }) =>
      state.map((candidate) => (candidate.id === update.id ? { ...candidate, stage: update.stage } : candidate)),
  )
  const [, startTransition] = useTransition()
  const groups = groupLeadsByStage(optimisticLeads)

  function handleStageChange(lead: Lead, stage: LeadStage) {
    if (stage === lead.stage) return
    if (requiresSaleCompletion(lead, stage)) {
      setSaleStageError(null)
      setSaleFormLead(lead)
      return
    }
    startTransition(async () => {
      setOptimisticLeadStage({ id: lead.id, stage })
      await adminUpdateLeadStage(lead.id, stage)
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const targetId = event.over?.id
    if (typeof targetId !== 'string' || !LEAD_STAGES.includes(targetId as LeadStage)) return
    const lead = optimisticLeads.find((candidate) => candidate.id === event.active.id)
    if (lead) handleStageChange(lead, targetId as LeadStage)
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => (
            <LeadKanbanColumn
              key={stage}
              stage={stage}
              leads={groups[stage]}
              vehicles={vehicles}
              onMoveToStage={handleStageChange}
            />
          ))}
        </div>
      </DndContext>

      {saleFormLead && saleFormLead.vehicle_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-lg font-bold">Registrar venda</h2>
            <VehicleSaleForm
              vehicleId={saleFormLead.vehicle_id}
              leads={leads}
              defaultBuyerLeadId={saleFormLead.id}
              onCancel={() => setSaleFormLead(null)}
              onSaved={async () => {
                try {
                  await adminUpdateLeadStage(saleFormLead.id, 'vendeu')
                  setSaleFormLead(null)
                  setSaleStageError(null)
                } catch {
                  setSaleStageError('Venda registrada, mas não foi possível mover o lead para "Comprou". Tente mover manualmente pelo quadro.')
                }
              }}
            />
            {saleStageError && <p className="mt-2 text-sm text-aguiar-red">{saleStageError}</p>}
          </div>
        </div>
      )}
    </>
  )
}
