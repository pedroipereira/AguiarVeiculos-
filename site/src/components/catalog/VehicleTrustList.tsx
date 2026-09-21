import type { ReactNode } from 'react'

// The same promises the home page already makes about every car: "passa por seleção, revisão e higienização,
// permanece em nome da loja até a transferência e conta com 90 dias de garantia para motor e câmbio".
const iconClass = 'h-[18px] w-[18px]'
const PROMISES: { text: string; icon: ReactNode }[] = [
  {
    text: '90 dias de garantia para motor e câmbio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    text: 'Revisado e higienizado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />
      </svg>
    ),
  },
  {
    text: 'Em nome da loja até a transferência',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    ),
  },
]

/**
 * Stacked on a phone; from the tablet up the three sit side by side with hairlines between them, so the
 * panel is not left with an empty space beside each short line.
 */
export function VehicleTrustList({ className = '' }: { className?: string }) {
  return (
    <ul
      className={`flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/10 md:p-5 ${className}`}
    >
      {PROMISES.map((promise) => (
        <li key={promise.text} className="flex items-center gap-3 text-sm text-white/90 md:px-5 md:first:pl-0 md:last:pr-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aguiar-red/15 text-aguiar-red-light">
            {promise.icon}
          </span>
          {promise.text}
        </li>
      ))}
    </ul>
  )
}
