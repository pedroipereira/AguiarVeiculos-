import type { HTMLAttributes } from 'react'

// `dark` is a thin-bordered panel, a hair lighter than the black page, for the home page.
const surfaces = {
  gray: 'border-support-gray/10 bg-card-gray text-graphite shadow-sm',
  white: 'border-support-gray/10 bg-white text-graphite shadow-sm',
  dark: 'border-white/10 bg-white/[0.04] text-white',
}

export function Card({
  className = '',
  surface = 'gray',
  ...props
}: HTMLAttributes<HTMLDivElement> & { surface?: keyof typeof surfaces }) {
  return <div className={`rounded-lg border ${surfaces[surface]} p-6 ${className}`} {...props} />
}
