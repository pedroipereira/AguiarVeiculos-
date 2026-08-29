import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg bg-card-gray p-6 text-graphite ${className}`} {...props} />
}
