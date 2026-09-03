'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'
import { calculateGoalProgress } from '@/lib/dashboard'
import { anton } from '@/lib/fonts'

interface GoalProgressBannerProps {
  soldCount: number
  goal: number | null
  now?: Date
}

export function GoalProgressBanner({ soldCount, goal, now = new Date() }: GoalProgressBannerProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const progress = calculateGoalProgress(soldCount, goal, now)
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await adminSetSiteSetting('monthly_sales_goal', String(formData.get('goal') || ''))
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-graphite p-6 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-white/70">Meta de {monthLabel}</p>
          {progress ? (
            <p className={`${anton.className} text-3xl`}>
              {soldCount} de {goal} vendas
            </p>
          ) : (
            <p className="text-lg font-bold">Nenhuma meta definida para este mês</p>
          )}
        </div>
        {progress && <p className={`${anton.className} text-4xl text-aguiar-red`}>{progress.percent}%</p>}
      </div>

      {progress && (
        <>
          <p className="text-sm text-white/70">
            Faltam {progress.remaining} em {progress.businessDaysLeft} dias úteis.
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-aguiar-red transition-all"
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
        </>
      )}

      <div>
        {editing ? (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <label htmlFor="goal" className="text-sm text-white/70">
              Meta de vendas do mês
            </label>
            <input
              id="goal"
              name="goal"
              type="number"
              min={1}
              defaultValue={goal ?? ''}
              autoFocus
              className="w-20 rounded-lg border border-white/25 bg-transparent p-1.5 text-center text-sm text-white focus:border-white focus:outline-none"
            />
            <Button type="submit" disabled={saving} className="px-4 py-1.5 text-xs">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-bold text-white/70 hover:text-white"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-bold uppercase tracking-wide text-white/70 hover:text-white"
          >
            {goal == null ? 'Definir meta' : 'Editar meta'}
          </button>
        )}
      </div>
    </section>
  )
}
