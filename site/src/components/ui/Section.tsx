import type { ReactNode } from 'react'

interface SectionProps {
  eyebrow?: string
  title?: string
  children: ReactNode
  className?: string
}

export function Section({ eyebrow, title, children, className = '' }: SectionProps) {
  return (
    <section className={`py-16 px-6 ${className}`}>
      {eyebrow && <p className="mb-2 text-sm font-bold uppercase text-aguiar-red">{eyebrow}</p>}
      {title && <h2 className="mb-8 text-3xl font-bold uppercase">{title}</h2>}
      {children}
    </section>
  )
}
