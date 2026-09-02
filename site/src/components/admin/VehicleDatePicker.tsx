'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
 *
 * The calendar itself is portaled to `document.body` and positioned with
 * `fixed` coordinates from the trigger's bounding rect, rather than being
 * `position: absolute` inside the trigger's own wrapper — that way it's never
 * clipped by a scrollable ancestor (e.g. a modal with `overflow-y-auto`).
 *
 * Outside clicks close it via a real document `mousedown` listener (not a
 * full-screen catcher div) — that way clicking a *different* picker's trigger
 * closes this one and lets that click through in the same gesture, instead of
 * being swallowed by an invisible overlay and requiring a second click.
 */
export function VehicleDatePicker({ id, value, onChange }: VehicleDatePickerProps) {
  const selectedDate = parseIsoDate(value)
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const weeks = buildMonthGrid(year, month)

  useEffect(() => {
    if (!open) return
    function handleOutsideMouseDown(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideMouseDown)
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown)
  }, [open])

  function selectDay(date: Date) {
    onChange(toIsoDate(date))
    setOpen(false)
  }

  function changeMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1))
  }

  function openPicker() {
    setViewDate(selectedDate ?? new Date())
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setPosition({ top: rect.bottom + 8, left: rect.left })
    setOpen(true)
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
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

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-50 w-72 rounded-lg border border-support-gray/25 bg-white p-3 shadow-lg"
            style={{ top: position.top, left: position.left }}
          >
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
          </div>,
          document.body,
        )}
    </div>
  )
}
