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

const SEGMENT_HEIGHT = 40
// Each segment's own trapezoid tapers by this fixed ratio, independent of
// every other segment's count. Recharts' Funnel chains adjacent segments'
// widths together assuming values decrease monotonically top-to-bottom —
// real lead counts per stage don't (e.g. "Ligar de volta" can outnumber
// "Negociando"), and feeding that data through Recharts' Funnel produced
// self-intersecting trapezoids (a bowtie/diamond shape) wherever a count
// rose between adjacent stages. Drawing each stage as its own independent
// shape sidesteps that entirely — there is no shared edge to invert.
const TAPER_CLIP_PATH = 'polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)'

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
        <div className="flex flex-col items-center gap-2">
          {data.map((entry) => {
            const widthPercent = entry.count === 0 ? 0 : Math.max(8, (entry.count / maxCount) * 92)
            return (
              <div key={entry.stage} className="flex w-full flex-col items-center gap-1">
                {widthPercent > 0 && (
                  <div
                    style={{
                      width: `${widthPercent}%`,
                      height: SEGMENT_HEIGHT,
                      backgroundColor: STAGE_COLORS[entry.stage],
                      clipPath: TAPER_CLIP_PATH,
                    }}
                  />
                )}
                <p className="text-xs font-bold text-graphite">
                  {entry.label} · {entry.count}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
