import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded px-6 py-3 font-bold uppercase tracking-wide transition-colors'
  const variants = {
    primary: 'bg-aguiar-red text-white hover:bg-red-700',
    outline: 'border-2 border-white text-white hover:bg-white hover:text-graphite',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
