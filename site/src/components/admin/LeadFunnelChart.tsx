import type { Lead, LeadStage } from '@/lib/types'
import { getFunnelData } from '@/lib/dashboard'

interface LeadFunnelChartProps {
  leads: Lead[]
}

// Same blue/orange/yellow/pink/green family as LEAD_STAGE_ACCENTS for the
// kanban (minus "não comprou", not part of the funnel), one shade lighter
// (400 instead of 500/600) so the funnel reads softer against the white
// card than the kanban's bolder borders do.
const STAGE_COLORS: Record<Exclude<LeadStage, 'nao_comprou'>, string> = {
  novo: '#60a5fa',
  visita_marcada: '#fb923c',
  negociando: '#facc15',
  ligar_de_volta: '#f472b6',
  vendeu: '#4ade80',
}

export function LeadFunnelChart({ leads }: LeadFunnelChartProps) {
  const data = getFunnelData(leads)
  const total = data.reduce((sum, entry) => sum + entry.count, 0)
  const maxCount = Math.max(...data.map((entry) => entry.count), 1)

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Funil</h2>
        <p className="text-sm text-support-gray">Distribuição de clientes por etapa</p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-support-gray">Nenhum cliente no funil ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((entry) => {
            // Every row is the same fixed height regardless of count — a
            // 0-count stage still shows its track, so rows never collapse
            // and leave uneven blank space between the tall/short ones.
            const fillPercent = (entry.count / maxCount) * 100
            return (
              <div key={entry.stage} className="flex items-center gap-3">
                <p className="w-32 shrink-0 text-sm text-support-gray">{entry.label}</p>
                <div className="h-8 flex-1 overflow-hidden rounded-md bg-card-gray">
                  {fillPercent > 0 && (
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${fillPercent}%`, backgroundColor: STAGE_COLORS[entry.stage] }}
                    />
                  )}
                </div>
                <p className="w-6 shrink-0 text-right text-sm font-bold text-graphite">{entry.count}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
