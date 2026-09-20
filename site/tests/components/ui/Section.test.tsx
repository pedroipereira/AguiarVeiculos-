import { render, screen } from '@testing-library/react'
import { Section, SectionHeader } from '@/components/ui/Section'

describe('Section', () => {
  it('keeps the small label readable on a dark background: light text, not the dim gray', () => {
    render(<Section eyebrow="Quem compra recomenda" tone="dark">conteúdo</Section>)
    const label = screen.getByText('Quem compra recomenda')
    expect(label).toHaveClass('text-white/85')
    expect(label).not.toHaveClass('text-support-gray')
  })

  it('keeps the gray label on a light background, where it has enough contrast', () => {
    render(<Section eyebrow="Estoque" tone="light">conteúdo</Section>)
    expect(screen.getByText('Estoque')).toHaveClass('text-support-gray')
  })

  it('treats a section with no tone as dark', () => {
    render(<Section eyebrow="Sem tom">conteúdo</Section>)
    expect(screen.getByText('Sem tom')).toHaveClass('text-white/85')
  })

  it('has a soft white, a bit darker than pure white, with dark text and a readable dark label', () => {
    const { container } = render(<Section eyebrow="Alterna" tone="light-soft">conteúdo</Section>)
    const section = container.querySelector('section')!
    expect(section).toHaveClass('bg-paper')
    expect(section).toHaveClass('text-graphite')
    expect(screen.getByText('Alterna')).toHaveClass('text-graphite/70')
  })

  it('separates the sections with a thin line, dark on the light ones and light on the black ones', () => {
    const dark = render(<Section tone="dark">a</Section>).container.querySelector('section')!
    const soft = render(<Section tone="light-soft">b</Section>).container.querySelector('section')!
    expect(dark).toHaveClass('border-t', 'border-white/10')
    expect(soft).toHaveClass('border-t', 'border-graphite/10')
  })

  it('paints the dark tone in the brand graphite, the same black as the photo sections', () => {
    const section = render(<Section tone="dark">a</Section>).container.querySelector('section')!
    expect(section).toHaveClass('bg-graphite')
    expect(section).not.toHaveClass('bg-charcoal')
  })

  it('has a regular title size and a compact one', () => {
    const regular = render(<Section title="Normal">a</Section>)
    expect(screen.getByRole('heading', { name: 'Normal' })).toHaveClass('text-4xl', 'md:text-5xl')
    regular.unmount()
    render(<Section title="Menor" titleSize="compact">a</Section>)
    const compact = screen.getByRole('heading', { name: 'Menor' })
    expect(compact).toHaveClass('text-3xl', 'md:text-4xl')
    expect(compact).not.toHaveClass('md:text-5xl')
  })

  it('offers its header on its own, to place it inside a column', () => {
    render(<SectionHeader eyebrow="Rótulo" title="Título" tone="dark" titleSize="compact" />)
    expect(screen.getByText('Rótulo')).toHaveClass('text-white/85', 'uppercase')
    expect(screen.getByRole('heading', { level: 2, name: 'Título' })).toHaveClass('text-3xl', 'md:text-4xl')
  })
})
