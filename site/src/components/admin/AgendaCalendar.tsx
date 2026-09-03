'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Lead } from '@/lib/types'
import { getAgendaEventsByDate, buildAgendaMonthGrid, type AgendaEvent } from '@/lib/agenda'
import { formatMonthLabel, shiftMonth } from '@/lib/lead-summary'
import { formatIsoDate } from '@/lib/lead-kanban'

interface AgendaCalendarProps {
  leads: Lead[]
  initialMonth: string
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const EVENT_DOT_CLASS: Record<AgendaEvent['type'], string> = {
  visita: 'bg-blue-500',
  retorno: 'bg-orange-500',
  comercial: 'bg-aguiar-red',
}

const EVENT_TYPE_LABEL: Record<AgendaEvent['type'], string> = {
  visita: 'Visita marcada',
  retorno: 'Retorno',
  comercial: 'Data comercial',
}

export function AgendaCalendar({ leads, initialMonth }: AgendaCalendarProps) {
  const [month, setMonth] = useState(initialMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const eventsByDate = useMemo(() => getAgendaEventsByDate(leads, month), [leads, month])
  const [year, monthNum] = month.split('-').map(Number)
  const grid = useMemo(() => buildAgendaMonthGrid(year, monthNum - 1), [year, monthNum])

  function changeMonth(delta: number) {
    setMonth((current) => shiftMonth(current, delta))
    setSelectedDate(null)
  }

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase">Agenda</h1>
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

            if (events.length === 0) {
              return (
                <div key={date} className="flex h-16 flex-col items-center gap-1 rounded-lg p-1 text-sm text-graphite">
                  <span>{dayNumber}</span>
                </div>
              )
            }

            const types = Array.from(new Set(events.map((event) => event.type)))
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className="flex h-16 flex-col items-center gap-1 rounded-lg p-1 text-sm text-graphite transition-colors hover:bg-support-gray/10"
              >
                <span>{dayNumber}</span>
                <span className="flex gap-0.5">
                  {types.map((type) => (
                    <span key={type} className={`h-1.5 w-1.5 rounded-full ${EVENT_DOT_CLASS[type]}`} />
                  ))}
                </span>
              </button>
            )
          }),
        )}
      </div>

      {selectedDate && (
        <div className="flex flex-col gap-2 rounded-lg border border-support-gray/15 p-4">
          <p className="text-sm font-bold text-graphite">{formatIsoDate(selectedDate)}</p>
          <ul className="flex flex-col gap-2">
            {selectedEvents.map((event, index) => (
              <li key={index} className="flex items-center justify-between text-sm">
                <span>
                  <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${EVENT_DOT_CLASS[event.type]}`} />
                  {event.label}
                  {event.time ? ` às ${event.time.slice(0, 5)}` : ''}
                  <span className="ml-2 text-xs text-support-gray">{EVENT_TYPE_LABEL[event.type]}</span>
                </span>
                {event.leadId && (
                  <Link href="/admin/leads" className="text-xs font-bold text-aguiar-red hover:underline">
                    Ver cliente
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
