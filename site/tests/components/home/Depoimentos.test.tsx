import { render, screen } from '@testing-library/react'
import { Depoimentos } from '@/components/home/Depoimentos'

function fakeClient(rows: any[]) {
  const chain: any = { select: () => chain, order: async () => ({ data: rows, error: null }) }
  return { from: () => chain } as any
}

describe('Depoimentos', () => {
  it('renders one card per published testimonial', async () => {
    const client = fakeClient([
      { id: '1', image_url: 'https://x/1.jpg', caption: 'Realizei meu sonho! 🙏' },
    ])
    render(await Depoimentos({ client }))
    // The loop repeats each card, so the caption appears more than once in the DOM.
    expect(screen.getAllByText('Realizei meu sonho! 🙏').length).toBeGreaterThan(0)
    expect(screen.getByAltText(/depoimento de cliente/i)).toHaveAttribute('src', 'https://x/1.jpg')
  })

  it('invites customers to review the store on Google', async () => {
    const client = fakeClient([{ id: '1', image_url: 'https://x/1.jpg', caption: 'Legenda' }])
    render(await Depoimentos({ client }))
    const link = screen.getByRole('link', { name: /avaliar a aguiar no google/i })
    expect(link).toHaveAttribute('href', 'https://g.page/r/CbJ6h9XEzhUTEBM/review')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('asks for the review in plain, warm words', async () => {
    const client = fakeClient([{ id: '1', image_url: 'https://x/1.jpg', caption: 'Legenda' }])
    render(await Depoimentos({ client }))
    expect(screen.getByText('Sua opinião leva a Aguiar mais longe')).toBeInTheDocument()
    expect(screen.getByText(/foi na aguiar veículos e gostou do atendimento\?/i)).toBeInTheDocument()
    expect(screen.getByText(/ajude outros clientes a chegarem até a gente/i)).toBeInTheDocument()
    expect(screen.queryByText(/vale ouro/i)).not.toBeInTheDocument()
  })

  it('has no outline on the review button, and fills it with white on hover', async () => {
    const client = fakeClient([{ id: '1', image_url: 'https://x/1.jpg', caption: 'Legenda' }])
    render(await Depoimentos({ client }))
    const link = screen.getByRole('link', { name: /avaliar a aguiar no google/i })
    expect(link.className).not.toMatch(/(^|\s)border(-|\s|$)/)
    expect(link).toHaveClass('bg-white/10')
    expect(link).toHaveClass('text-white')
    expect(link).toHaveClass('hover:bg-white')
    expect(link).toHaveClass('hover:text-graphite')
  })

  it('renders nothing visible when there are no published testimonials', async () => {
    const client = fakeClient([])
    const { container } = render(await Depoimentos({ client }))
    expect(container).toBeEmptyDOMElement()
  })

  it('passes the light background on to the carousel and to the Google invitation', async () => {
    const client = fakeClient([{ id: '1', image_url: 'https://x/1.jpg', caption: 'Legenda' }])
    const { container } = render(await Depoimentos({ client, tone: 'light-soft' }))
    expect(container.querySelector('section')).toHaveClass('bg-paper')
    expect(screen.getAllByTestId('testimonial-card')[0]).toHaveClass('bg-white')
    const title = screen.getByText('Sua opinião leva a Aguiar mais longe')
    const panel = title.closest('div')!.parentElement!
    expect(panel).toHaveClass('bg-white')
    expect(title).not.toHaveClass('text-white')
    expect(screen.getByText(/foi na aguiar veículos e gostou do atendimento/i)).toHaveClass('text-graphite/70')
    const link = screen.getByRole('link', { name: /avaliar a aguiar no google/i })
    expect(link).toHaveClass('bg-graphite/5', 'text-graphite', 'hover:bg-graphite', 'hover:text-white')
    expect(link.className).not.toMatch(/(^|\s)border(-|\s|$)/)
  })
})
