'use client'

import { FunnelChart, Funnel, Cell, LabelList, Tooltip, ResponsiveContainer } from 'recharts'
import type { Lead } from '@/lib/types'
import { getFunnelData, type FunnelStage } from '@/lib/dashboard'

interface LeadFunnelChartProps {
  leads: Lead[]
}

// Solid hex fills for the funnel's SVG segments — Recharts needs literal
// colors, not Tailwind classes. Same blue/orange/yellow/pink/green family
// as LEAD_STAGE_ACCENTS for the kanban (minus "não comprou", not part of
// the funnel), one shade lighter (400 instead of 500/600) so the funnel
// reads softer against the white card than the kanban's bolder borders do.
const FUNNEL_STAGE_COLORS: Record<FunnelStage, string> = {
  novo: '#60a5fa',
  visita_marcada: '#fb923c',
  negociando: '#facc15',
  ligar_de_volta: '#f472b6',
  vendeu: '#4ade80',
}

export function LeadFunnelChart({ leads }: LeadFunnelChartProps) {
  const data = getFunnelData(leads)
  const total = data.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Funil</h2>
        <p className="text-sm text-support-gray">Distribuição de clientes por etapa</p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-support-gray">Nenhum cliente no funil ainda.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {/* Generous right margin so the stage-name labels (up to "Ligar de
              volta") never clip past the SVG viewport — Recharts' default
              chart margin only leaves 5px. */}
          <FunnelChart margin={{ top: 8, right: 96, bottom: 8, left: 8 }}>
            <Tooltip />
            <Funnel dataKey="count" data={data} isAnimationActive={false}>
              <LabelList dataKey="label" position="right" fill="#6E6E6E" stroke="none" fontSize={13} />
              {data.map((entry) => (
                <Cell key={entry.stage} fill={FUNNEL_STAGE_COLORS[entry.stage]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
