interface VehicleOptionalsListProps {
  optionals: string[]
}

/** Read-only pill list for the public vehicle detail page — same visual language
 *  as the admin's VehicleOptionalsPicker, but nothing here is clickable. */
export function VehicleOptionalsList({ optionals }: VehicleOptionalsListProps) {
  if (optionals.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {optionals.map((optional) => (
        <span
          key={optional}
          className="rounded-full border border-aguiar-red bg-aguiar-red px-3 py-1.5 text-sm font-bold text-white"
        >
          {optional}
        </span>
      ))}
    </div>
  )
}
