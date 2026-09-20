import type { ReactNode } from 'react'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'

export type SectionTone = 'dark' | 'light' | 'light-soft'

export function isLightTone(tone: SectionTone) {
  return tone !== 'dark'
}

/** Secondary text color for each background: the regular gray is too faint on black and on the soft white. */
export function mutedTextClass(tone: SectionTone) {
  return { dark: 'text-white/70', light: 'text-support-gray', 'light-soft': 'text-graphite/70' }[tone]
}

interface SectionProps {
  eyebrow?: string
  title?: ReactNode
  children: ReactNode
  className?: string
  tone?: SectionTone
  id?: string
  contained?: boolean
  titleClassName?: string
  titleUppercase?: boolean
}

export function Section({
  eyebrow,
  title,
  children,
  className = '',
  tone = 'dark',
  id,
  contained = false,
  titleClassName = '',
  titleUppercase = false,
}: SectionProps) {
  const toneClasses = {
    light: 'bg-white text-graphite',
    'light-soft': 'bg-paper text-graphite border-t border-graphite/10',
    dark: 'bg-charcoal text-white border-t border-white/10',
  }[tone]
  const titleCaseClass = titleUppercase ? 'uppercase' : 'normal-case'
  const content = (
    <>
      {eyebrow && (
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
          <p className={`text-sm font-bold uppercase tracking-widest ${mutedTextClass(tone)}`}>{eyebrow}</p>
        </div>
      )}
      {title && (
        <h2 className={`mb-6 text-4xl font-bold ${titleCaseClass} leading-tight md:text-5xl ${titleClassName}`}>
          {title}
        </h2>
      )}
      {children}
    </>
  )

  return (
    <section id={id} className={`scroll-mt-24 py-16 px-6 ${toneClasses} ${className}`}>
      <RevealOnScroll>{contained ? <div className="mx-auto max-w-[1156px]">{content}</div> : content}</RevealOnScroll>
    </section>
  )
}
