import { render, screen } from '@testing-library/react'
import { QuinzeAnos } from '@/components/home/QuinzeAnos'

describe('QuinzeAnos', () => {
  it('tells the company story, credits the founder, and lists reasons to choose Aguiar', () => {
    render(<QuinzeAnos />)
    expect(screen.getByText(/sobre a aguiar veículos/i)).toBeInTheDocument()
    expect(screen.getByAltText(/antonio aguiar/i)).toBeInTheDocument()
    expect(screen.getByText(/há mais de 15 anos no mesmo endereço/i)).toBeInTheDocument()
    expect(screen.getByText(/90 dias de garantia para motor e câmbio/i)).toBeInTheDocument()
    expect(screen.getByText(/maior estoque da região/i)).toBeInTheDocument()
    expect(screen.getByText(/toda a região do maranhão/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver estoque/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /fale conosco/i })).toBeInTheDocument()
  })

  it('keeps the story and the reasons readable on the dark background', () => {
    render(<QuinzeAnos tone="dark" />)
    for (const text of [/há mais de 15 anos no mesmo endereço/i, /cobertura em motor e câmbio/i]) {
      expect(screen.getByText(text)).toHaveClass('text-white/85')
      expect(screen.getByText(text)).not.toHaveClass('text-support-gray')
    }
  })

  it('keeps the gray text when the section is light', () => {
    render(<QuinzeAnos tone="light" />)
    expect(screen.getByText(/há mais de 15 anos no mesmo endereço/i)).toHaveClass('text-support-gray')
  })

  it('uses a darker gray on the soft white, where the regular gray is too faint', () => {
    render(<QuinzeAnos tone="light-soft" />)
    const paragraph = screen.getByText(/há mais de 15 anos no mesmo endereço/i)
    expect(paragraph).toHaveClass('text-graphite/70')
    expect(screen.getByText(/cobertura em motor e câmbio/i)).toHaveClass('text-graphite/70')
  })

  it('draws the "Fale conosco" button in dark on a light background, and in white on a dark one', () => {
    const light = render(<QuinzeAnos tone="light-soft" />)
    const onLight = screen.getByRole('link', { name: /fale conosco/i })
    expect(onLight).toHaveClass('border-graphite', 'text-graphite')
    expect(onLight).not.toHaveClass('text-white')
    light.unmount()
    render(<QuinzeAnos tone="dark" />)
    expect(screen.getByRole('link', { name: /fale conosco/i })).toHaveClass('border-white', 'text-white')
  })

  it('shows each differential as a dark panel with a thin border on the black page', () => {
    render(<QuinzeAnos tone="dark" />)
    const panels = screen.getAllByTestId('diferencial')
    expect(panels).toHaveLength(6)
    for (const panel of panels) expect(panel).toHaveClass('rounded-2xl', 'border', 'border-white/10', 'bg-white/[0.04]')
  })

  it('keeps the differentials as a plain list on light backgrounds', () => {
    render(<QuinzeAnos tone="light-soft" />)
    for (const panel of screen.getAllByTestId('diferencial')) expect(panel).not.toHaveClass('bg-white/[0.04]')
  })

  it('gives the founder photo more room, with rounded corners', () => {
    render(<QuinzeAnos tone="dark" />)
    const photo = screen.getByAltText(/antonio aguiar/i)
    expect(photo).toHaveClass('rounded-2xl', 'max-w-md', 'lg:w-5/12')
    expect(photo).not.toHaveClass('lg:w-1/3')
  })

  it('highlights the differential under the pointer like a selection, and dims the others', () => {
    render(<QuinzeAnos tone="dark" />)
    const panels = screen.getAllByTestId('diferencial')
    // The grid is the group: while the pointer is over it, every panel dims...
    expect(panels[0].parentElement).toHaveClass('group')
    // ...except the one being pointed at, which lifts and lights up its border.
    for (const panel of panels) {
      expect(panel).toHaveClass(
        'group/item', 'transition-all', 'group-hover:opacity-60', 'hover:!opacity-100',
        'hover:-translate-y-1', 'hover:border-aguiar-red/60', 'hover:bg-white/[0.08]',
      )
    }
  })

  it('grows the small red mark of the selected differential', () => {
    render(<QuinzeAnos tone="dark" />)
    const mark = screen.getAllByTestId('diferencial')[0].querySelector('span[aria-hidden="true"]')!
    expect(mark).toHaveClass('w-6', 'transition-all', 'group-hover/item:w-10')
  })

  it('stays still for visitors who ask for less motion', () => {
    render(<QuinzeAnos tone="dark" />)
    expect(screen.getAllByTestId('diferencial')[0]).toHaveClass('motion-reduce:transition-none', 'motion-reduce:hover:translate-y-0')
  })

  it('has no selection effect on the plain list of the light backgrounds', () => {
    render(<QuinzeAnos tone="light-soft" />)
    for (const panel of screen.getAllByTestId('diferencial')) expect(panel).not.toHaveClass('hover:-translate-y-1')
  })
})
