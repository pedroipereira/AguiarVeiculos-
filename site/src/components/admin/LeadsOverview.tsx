'use client'

import { useState } from 'react'
import type { Lead, Vehicle } from '@/lib/types'
import type { VehicleOption } from '@/lib/queries/vehicles'
import { getLeadSummaryCounts, getBuyers, getCurrentMonthValue, formatMonthLabel, shiftMonth } from '@/lib/lead-summary'
import { LeadSummaryCards } from './LeadSummaryCards'
import { LeadKanbanBoard } from './LeadKanbanBoard'
import { BuyersList } from './BuyersList'
import { LeadQuickAddModal } from './LeadQuickAddModal'

interface LeadsOverviewProps {
  leads: Lead[]
  vehicles: Vehicle[]
  vehicleOptions: VehicleOption[]
}

type LeadsTab = 'funil' | 'compradores'

const TABS: { value: LeadsTab; label: string }[] = [
  { value: 'funil', label: 'Funil' },
  { value: 'compradores', label: 'Compradores' },
]

export function LeadsOverview({ leads, vehicles, vehicleOptions }: LeadsOverviewProps) {
  const [month, setMonth] = useState(() => getCurrentMonthValue())
  const [activeTab, setActiveTab] = useState<LeadsTab>('funil')
  const [showLeadModal, setShowLeadModal] = useState(false)

  const counts = getLeadSummaryCounts(leads, vehicles, month)
  const buyers = getBuyers(leads, vehicles, month)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold uppercase">Leads</h1>
        <button
          type="button"
          onClick={() => setShowLeadModal(true)}
          className="rounded-lg bg-aguiar-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          + Novo cliente
        </button>
      </div>

      <LeadSummaryCards
        activeCount={counts.active}
        negotiatingCount={counts.negotiating}
        overdueCount={counts.overdue}
        soldCount={counts.soldInMonth}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab.value
                  ? 'border-graphite bg-graphite text-white'
                  : 'border-support-gray/25 text-graphite hover:border-graphite'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-support-gray/25 px-1 py-1">
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            aria-label="Mês anterior"
            className="rounded-full p-2 text-graphite transition-colors hover:bg-support-gray/10"
          >
            ‹
          </button>
          <span className="min-w-[9rem] text-center text-sm font-bold text-graphite">{formatMonthLabel(month)}</span>
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            aria-label="Próximo mês"
            className="rounded-full p-2 text-graphite transition-colors hover:bg-support-gray/10"
          >
            ›
          </button>
        </div>
      </div>

      {activeTab === 'funil' ? (
        <LeadKanbanBoard leads={leads} vehicles={vehicleOptions} />
      ) : (
        <BuyersList buyers={buyers} />
      )}

      {showLeadModal && <LeadQuickAddModal vehicles={vehicleOptions} onClose={() => setShowLeadModal(false)} />}
    </div>
  )
}
