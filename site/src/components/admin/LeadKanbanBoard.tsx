'use client'

import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import type { Lead, LeadStage } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { LEAD_STAGES, LEAD_STAGE_LABELS, groupLeadsByStage, requiresSaleCompletion } from '@/lib/lead-kanban'
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

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-3 rounded-xl p-3 ${isOver ? 'bg-card-gray' : 'bg-card-gray/50'}`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wide text-graphite">{LEAD_STAGE_LABELS[stage]}</h2>
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
  // A small activation distance lets a plain click on a card's buttons pass
  // through as a click instead of being swallowed as a (zero-distance) drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const groups = groupLeadsByStage(leads)

  function handleStageChange(lead: Lead, stage: LeadStage) {
    if (stage === lead.stage) return
    if (requiresSaleCompletion(lead, stage)) {
      setSaleFormLead(lead)
      return
    }
    adminUpdateLeadStage(lead.id, stage)
  }

  function handleDragEnd(event: DragEndEvent) {
    const targetId = event.over?.id
    if (typeof targetId !== 'string' || !LEAD_STAGES.includes(targetId as LeadStage)) return
    const lead = leads.find((candidate) => candidate.id === event.active.id)
    if (lead) handleStageChange(lead, targetId as LeadStage)
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
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
              onSaved={() => {
                adminUpdateLeadStage(saleFormLead.id, 'vendeu')
                setSaleFormLead(null)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
