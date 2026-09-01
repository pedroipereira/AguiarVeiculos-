'use client'

import { useState } from 'react'

interface VehicleDatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function parseIsoDate(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstDay.getDay()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/**
 * Custom calendar dropdown — replaces the native `<input type="date">` popup,
 * which is browser/OS-rendered and can't be restyled to match the brand.
 */
export function VehicleDatePicker({ id, value, onChange }: VehicleDatePickerProps) {
  const selectedDate = parseIsoDate(value)
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const weeks = buildMonthGrid(year, month)

  function selectDay(date: Date) {
    onChange(toIsoDate(date))
    setOpen(false)
  }

  function changeMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1))
  }

  function openPicker() {
    setViewDate(selectedDate ?? new Date())
    setOpen(true)
  }

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-support-gray/25 p-2.5 text-left text-graphite transition-colors focus:border-aguiar-red focus:outline-none"
      >
        <span className={value ? '' : 'text-support-gray'}>
          {selectedDate ? selectedDate.toLocaleDateString('pt-BR') : 'Selecione a data'}
        </span>
        <span aria-hidden="true">📅</span>
      </button>

      {open && (
        <>
          {/* Click-outside catcher */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-2 w-72 rounded-lg border border-support-gray/25 bg-white p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Mês anterior"
                className="rounded p-1 text-graphite hover:bg-support-gray/10"
              >
                ‹
              </button>
              <p className="text-sm font-bold text-graphite">{MONTH_LABELS[month]} {year}</p>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Próximo mês"
                className="rounded p-1 text-graphite hover:bg-support-gray/10"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-support-gray">
              {WEEKDAY_LABELS.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((date, dayIndex) => {
                  if (!date) return <span key={dayIndex} />
                  const isSelected = selectedDate != null && toIsoDate(date) === toIsoDate(selectedDate)
                  return (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => selectDay(date)}
                      className={`rounded-full py-1 text-sm transition-colors ${
                        isSelected ? 'bg-aguiar-red text-white' : 'text-graphite hover:bg-support-gray/10'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
