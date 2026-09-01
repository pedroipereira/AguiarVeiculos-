'use client'

import { VEHICLE_OPTIONALS } from '@/lib/vehicle-optionals'

interface VehicleOptionalsPickerProps {
  selected: string[]
  onChange: (next: string[]) => void
}

export function VehicleOptionalsPicker({ selected, onChange }: VehicleOptionalsPickerProps) {
  function toggle(optional: string) {
    onChange(selected.includes(optional) ? selected.filter((o) => o !== optional) : [...selected, optional])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {VEHICLE_OPTIONALS.map((optional) => {
        const active = selected.includes(optional)
        return (
          <button
            key={optional}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(optional)}
            className={`rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
              active ? 'border-aguiar-red bg-aguiar-red text-white' : 'border-support-gray/25 text-graphite hover:border-graphite'
            }`}
          >
            {optional}
          </button>
        )
      })}
    </div>
  )
}
