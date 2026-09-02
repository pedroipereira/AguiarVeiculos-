'use client'

import { FunnelChart, Funnel, Cell, LabelList, Tooltip, ResponsiveContainer } from 'recharts'
import type { Lead, LeadStage } from '@/lib/types'
import { getFunnelData } from '@/lib/dashboard'

interface LeadFunnelChartProps {
  leads: Lead[]
}

// Solid hex fills for the funnel's SVG segments — Recharts needs literal
// colors, not Tailwind classes. Same blue/orange/yellow/pink/green already
// used by LEAD_STAGE_ACCENTS for the kanban, minus "não comprou" (not part
// of the funnel).
const FUNNEL_STAGE_COLORS: Record<Exclude<LeadStage, 'nao_comprou'>, string> = {
  novo: '#3b82f6',
  visita_marcada: '#f97316',
  negociando: '#eab308',
  ligar_de_volta: '#ec4899',
  vendeu: '#16a34a',
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
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="count" data={data} isAnimationActive={false}>
              <LabelList dataKey="label" position="right" fill="#111111" stroke="none" />
              {data.map((entry) => (
                <Cell key={entry.stage} fill={FUNNEL_STAGE_COLORS[entry.stage as Exclude<LeadStage, 'nao_comprou'>]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
