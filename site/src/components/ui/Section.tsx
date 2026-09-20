import type { ReactNode } from 'react'
import { RevealOnScroll } from '@/components/ui/RevealOnScroll'

export type SectionTone = 'dark' | 'light' | 'light-soft'

export function isLightTone(tone: SectionTone) {
  return tone !== 'dark'
}

/** Secondary text color for each background: the regular gray is too faint on black and on the soft white. */
export function mutedTextClass(tone: SectionTone) {
  return { dark: 'text-white/85', light: 'text-support-gray', 'light-soft': 'text-graphite/70' }[tone]
}

interface SectionHeaderProps {
  eyebrow?: string
  title?: ReactNode
  tone?: SectionTone
  titleClassName?: string
  titleSize?: 'regular' | 'compact'
  titleUppercase?: boolean
}

/** The small label and the title of a section. Also usable on its own, to place it inside a column. */
export function SectionHeader({
  eyebrow,
  title,
  tone = 'dark',
  titleClassName = '',
  titleSize = 'regular',
  titleUppercase = false,
}: SectionHeaderProps) {
  const titleSizeClass = titleSize === 'compact' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'
  const titleCaseClass = titleUppercase ? 'uppercase' : 'normal-case'
  return (
    <>
      {eyebrow && (
        <div className="mb-2 flex items-center gap-3">
          <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
          <p className={`text-sm font-bold uppercase tracking-widest ${mutedTextClass(tone)}`}>{eyebrow}</p>
        </div>
      )}
      {title && (
        <h2 className={`mb-6 font-bold ${titleSizeClass} ${titleCaseClass} leading-tight ${titleClassName}`}>{title}</h2>
      )}
    </>
  )
}

interface SectionProps extends SectionHeaderProps {
  children: ReactNode
  className?: string
  id?: string
  contained?: boolean
}

export function Section({
  eyebrow,
  title,
  children,
  className = '',
  tone = 'dark',
  id,
  contained = false,
  titleClassName,
  titleSize,
  titleUppercase,
}: SectionProps) {
  const toneClasses = {
    light: 'bg-white text-graphite',
    'light-soft': 'bg-paper text-graphite border-t border-graphite/10',
    dark: 'bg-graphite text-white border-t border-white/10',
  }[tone]
  const content = (
    <>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        tone={tone}
        titleClassName={titleClassName}
        titleSize={titleSize}
        titleUppercase={titleUppercase}
      />
      {children}
    </>
  )

  return (
    <section id={id} className={`scroll-mt-24 py-16 px-6 ${toneClasses} ${className}`}>
      <RevealOnScroll>{contained ? <div className="mx-auto max-w-[1156px]">{content}</div> : content}</RevealOnScroll>
    </section>
  )
}
