import type { ButtonHTMLAttributes } from 'react'
import { buttonBase, buttonVariants } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />
}
