import type { HTMLAttributes } from 'react'

const surfaces = { gray: 'bg-card-gray', white: 'bg-white' }

export function Card({
  className = '',
  surface = 'gray',
  ...props
}: HTMLAttributes<HTMLDivElement> & { surface?: keyof typeof surfaces }) {
  return <div className={`rounded-lg border border-support-gray/10 ${surfaces[surface]} p-6 text-graphite shadow-sm ${className}`} {...props} />
}
