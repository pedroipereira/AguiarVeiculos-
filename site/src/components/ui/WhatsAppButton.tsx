import type { ReactNode } from 'react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const base = 'inline-flex items-center justify-center rounded px-6 py-3 font-bold uppercase tracking-wide transition-colors'
const variants = {
  primary: 'bg-aguiar-red text-white hover:bg-red-700',
  outline: 'border-2 border-white text-white hover:bg-white hover:text-graphite',
}

interface WhatsAppButtonProps {
  message: string
  children: ReactNode
  variant?: 'primary' | 'outline'
}

export function WhatsAppButton({ message, children, variant = 'primary' }: WhatsAppButtonProps) {
  return (
    <a href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" className={`${base} ${variants[variant]}`}>
      {children}
    </a>
  )
}
