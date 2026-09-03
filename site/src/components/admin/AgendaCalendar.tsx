'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Lead } from '@/lib/types'
import { getAgendaEventsByDate, buildAgendaMonthGrid, getAgendaStats, toIsoDate, type AgendaEvent } from '@/lib/agenda'
import { formatMonthLabel, shiftMonth } from '@/lib/lead-summary'
import { anton } from '@/lib/fonts'
import { AgendaIcon, AlertCircleIcon, ClockIcon, CheckCircleIcon } from './icons'

interface AgendaCalendarProps {
  leads: Lead[]
  initialMonth: string
  now?: Date
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MAX_VISIBLE_PILLS = 2

const EVENT_DOT_CLASS: Record<AgendaEvent['type'], string> = {
  visita: 'bg-blue-500',
  retorno: 'bg-orange-500',
  comercial: 'bg-aguiar-red',
}

const EVENT_PILL_CLASS: Record<AgendaEvent['type'], string> = {
  visita: 'bg-blue-100 text-blue-800',
  retorno: 'bg-orange-100 text-orange-800',
  comercial: 'bg-red-50 text-aguiar-red',
}

const EVENT_TYPE_LABEL: Record<AgendaEvent['type'], string> = {
  visita: 'Visita marcada',
  retorno: 'Retorno',
  comercial: 'Data comercial',
}

/** "Quinta-feira, 25 de junho" — built from local Date fields, never parsed
 *  from the ISO string via `new Date(iso)`, which reads as UTC midnight. */
function formatPanelDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long' })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day} de ${monthName}`
}

export function AgendaCalendar({ leads, initialMonth, now = new Date() }: AgendaCalendarProps) {
  const [month, setMonth] = useState(initialMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = toIsoDate(now)
  const effectiveDate = selectedDate ?? today
  const effectiveMonth = effectiveDate.slice(0, 7)

  const stats = useMemo(() => getAgendaStats(leads, now), [leads, now])
  const eventsByDate = useMemo(() => getAgendaEventsByDate(leads, month), [leads, month])
  const panelEvents = useMemo(
    () => getAgendaEventsByDate(leads, effectiveMonth)[effectiveDate] ?? [],
    [leads, effectiveMonth, effectiveDate],
  )
  const [year, monthNum] = month.split('-').map(Number)
  const grid = useMemo(() => buildAgendaMonthGrid(year, monthNum - 1), [year, monthNum])

  function changeMonth(delta: number) {
    setMonth((current) => shiftMonth(current, delta))
    setSelectedDate(null)
  }

  function goToToday() {
    setMonth(today.slice(0, 7))
    setSelectedDate(null)
  }

  const STATS = [
    { label: 'Visitas hoje', value: stats.visitsToday, Icon: CheckCircleIcon, chip: 'bg-blue-100 text-blue-800' },
    { label: 'Retornos hoje', value: stats.callbacksToday, Icon: AlertCircleIcon, chip: 'bg-orange-100 text-orange-800' },
    { label: 'Próximos 7 dias', value: stats.next7Days, Icon: AgendaIcon, chip: 'bg-support-gray/10 text-support-gray' },
    { label: 'Retornos atrasados', value: stats.overdueCallbacks, Icon: ClockIcon, chip: 'bg-aguiar-red/10 text-aguiar-red' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold uppercase">Agenda</h1>
        <p className="text-sm text-support-gray">Toque num dia para ver os agendamentos.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, Icon, chip }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${chip}`}>
              <Icon />
            </span>
            <div>
              <p className="text-sm text-support-gray">{label}</p>
              <p className={`${anton.className} text-3xl leading-none text-graphite`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Mês anterior"
                className="rounded-full p-2 text-graphite transition-colors hover:bg-support-gray/10"
              >
                ‹
              </button>
              <span className="min-w-[9rem] text-center text-sm font-bold text-graphite">{formatMonthLabel(month)}</span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Próximo mês"
                className="rounded-full p-2 text-graphite transition-colors hover:bg-support-gray/10"
              >
                ›
              </button>
            </div>
            <button type="button" onClick={goToToday} className="text-xs font-bold text-aguiar-red hover:underline">
              Hoje
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-support-gray">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.flatMap((week, weekIndex) =>
              week.map((date, dayIndex) => {
                if (!date) return <div key={`${weekIndex}-${dayIndex}`} />

                const events = eventsByDate[date] ?? []
                const dayNumber = Number(date.slice(-2))
                const isToday = date === today
                const isSelected = date === effectiveDate
                const visiblePills = events.slice(0, MAX_VISIBLE_PILLS)
                const hiddenCount = events.length - visiblePills.length

                return (
                  <button
                    key={date}
                    type="button"
                    aria-label={String(dayNumber)}
                    onClick={() => setSelectedDate(date)}
                    className={`flex min-h-[84px] flex-col items-start gap-1 rounded-lg border p-1.5 text-left text-sm transition-colors hover:bg-support-gray/10 ${
                      isSelected ? 'border-aguiar-red bg-aguiar-red/5' : 'border-transparent'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? 'bg-aguiar-red font-bold text-white' : 'text-graphite'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <div className="flex w-full flex-col gap-0.5">
                      {visiblePills.map((event, index) => (
                        <span
                          key={index}
                          className={`truncate rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${EVENT_PILL_CLASS[event.type]}`}
                        >
                          {event.label}
                        </span>
                      ))}
                      {hiddenCount > 0 && <span className="text-[10px] font-bold text-support-gray">+{hiddenCount}</span>}
                    </div>
                  </button>
                )
              }),
            )}
          </div>

          <div className="flex flex-wrap gap-4 border-t border-support-gray/15 pt-4 text-xs text-support-gray">
            {(['visita', 'retorno', 'comercial'] as const).map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${EVENT_DOT_CLASS[type]}`} />
                {type === 'visita' ? 'Visita agendada' : type === 'retorno' ? 'Retornar' : 'Data comercial'}
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-graphite">{formatPanelDate(effectiveDate)}</p>
            {effectiveDate === today && (
              <span className="rounded-full bg-aguiar-red/10 px-2 py-0.5 text-[10px] font-bold uppercase text-aguiar-red">
                hoje
              </span>
            )}
          </div>

          {panelEvents.length === 0 ? (
            <p className="text-sm text-support-gray">Nada agendado nesse dia.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {panelEvents.map((event, index) => (
                <li key={index} className="flex items-start justify-between gap-2 text-sm">
                  <span>
                    <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${EVENT_DOT_CLASS[event.type]}`} />
                    {event.label}
                    {event.time ? ` às ${event.time.slice(0, 5)}` : ''}
                    <span className="block text-xs text-support-gray">{EVENT_TYPE_LABEL[event.type]}</span>
                  </span>
                  {event.leadId && (
                    <Link href="/admin/leads" className="text-xs font-bold text-aguiar-red hover:underline">
                      Ver cliente
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
