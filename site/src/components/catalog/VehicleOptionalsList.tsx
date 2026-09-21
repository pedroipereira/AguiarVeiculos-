interface VehicleOptionalsListProps {
  optionals: string[]
}

/** Read-only pill list for the public vehicle detail page. Every item looks the same, "Outros" included:
 *  an outlined pill with a check mark, quiet enough that a long list does not turn into a wall of red. */
const isOther = (optional: string) => optional.trim().toLowerCase() === 'outros'

export function VehicleOptionalsList({ optionals }: VehicleOptionalsListProps) {
  if (optionals.length === 0) return null

  // "Outros" is the catch-all, so it goes last however it was marked. The sort is stable: the rest keep their order.
  const ordered = [...optionals].sort((a, b) => Number(isOther(a)) - Number(isOther(b)))

  return (
    <div className="flex flex-wrap gap-2">
      {ordered.map((optional) => (
        <span
          key={optional}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.04] px-3.5 py-1.5 text-sm font-bold text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 shrink-0 text-aguiar-red-light" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {optional}
        </span>
      ))}
    </div>
  )
}
