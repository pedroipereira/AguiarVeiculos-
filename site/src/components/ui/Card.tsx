import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg border border-support-gray/10 bg-card-gray p-6 text-graphite shadow-sm ${className}`} {...props} />
}
