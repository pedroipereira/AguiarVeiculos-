import type { ReactNode } from 'react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { buttonBase, buttonVariants } from './buttonStyles'

interface WhatsAppButtonProps {
  message: string
  children: ReactNode
  variant?: keyof typeof buttonVariants
  className?: string
}

export function WhatsAppButton({ message, children, variant = 'primary', className = '' }: WhatsAppButtonProps) {
  return (
    <a href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" className={`${buttonBase} ${buttonVariants[variant]} ${className}`.trim()}>
      {children}
    </a>
  )
}
