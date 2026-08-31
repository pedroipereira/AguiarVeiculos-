import type { ReactNode } from 'react'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'

export type SectionTone = 'dark' | 'light'

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
  const toneClasses = tone === 'light' ? 'bg-white text-graphite' : 'bg-graphite text-white'
  const titleCaseClass = titleUppercase ? 'uppercase' : 'normal-case'
  const content = (
    <>
      {eyebrow && (
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
          <p className="text-sm font-bold uppercase tracking-widest text-support-gray">{eyebrow}</p>
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
