'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'

interface StockTurnoverCardProps {
  avgDays: number
  availableCount: number
  staleCount: number
  thresholdDays: number
}

const GAUGE_RADIUS = 80
const GAUGE_CX = 100
const GAUGE_CY = 100
const GAUGE_STROKE = 16
const GAUGE_HALF_CIRCUMFERENCE = Math.PI * GAUGE_RADIUS
const GAUGE_PATH = `M ${GAUGE_CX - GAUGE_RADIUS} ${GAUGE_CY} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${GAUGE_CX + GAUGE_RADIUS} ${GAUGE_CY}`

export function StockTurnoverCard({ avgDays, availableCount, staleCount, thresholdDays }: StockTurnoverCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const onTimeRatio = availableCount > 0 ? Math.max(0, Math.min(1, (availableCount - staleCount) / availableCount)) : 1

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await adminSetSiteSetting('stock_turnover_threshold_days', String(formData.get('thresholdDays') || ''))
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Giro do estoque</h2>
        <p className="text-sm text-support-gray">Saúde dos carros em pátio hoje</p>
      </div>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
          <path
            d={GAUGE_PATH}
            fill="none"
            stroke="currentColor"
            className="text-card-gray"
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
          />
          <path
            d={GAUGE_PATH}
            fill="none"
            stroke="currentColor"
            className="text-green-500"
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${onTimeRatio * GAUGE_HALF_CIRCUMFERENCE} ${GAUGE_HALF_CIRCUMFERENCE}`}
          />
          <text x="100" y="90" textAnchor="middle" className="fill-graphite text-3xl font-bold">
            {avgDays}d
          </text>
        </svg>
        <p className="-mt-2 text-sm text-support-gray">giro médio do estoque</p>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-wide text-support-gray">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          No prazo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-support-gray/40" />
          Parado
        </span>
      </div>

      <div className="rounded-lg bg-card-gray p-3">
        {editing ? (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <label htmlFor="thresholdDays" className="text-sm text-support-gray">
              Considerar parado a partir de
            </label>
            <input
              id="thresholdDays"
              name="thresholdDays"
              type="number"
              min={1}
              defaultValue={thresholdDays}
              autoFocus
              className="w-20 rounded-lg border border-support-gray/25 p-1.5 text-center text-sm text-graphite focus:border-aguiar-red focus:outline-none"
            />
            <span className="text-sm text-support-gray">dias</span>
            <Button type="submit" disabled={saving} className="ml-auto px-4 py-1.5 text-xs">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-bold text-support-gray hover:text-graphite"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-support-gray">
              <span className="font-bold text-graphite">{staleCount}</span>{' '}
              {staleCount === 1 ? 'carro parado' : 'carros parados'} há mais de {thresholdDays} dias
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-bold uppercase tracking-wide text-aguiar-red hover:underline"
            >
              Editar
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
