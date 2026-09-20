import { render, screen, within } from '@testing-library/react'
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

  describe('the format of the invitation', () => {
    const testimonials = [{ id: '1', image_url: 'https://x/1.jpg', caption: 'Legenda' }]

    it('is a very rounded card, with the Google mark on the left, the text in the middle and the button on the right', async () => {
      render(await Depoimentos({ client: fakeClient(testimonials) }))
      const card = screen.getByTestId('google-cta')
      expect(card).toHaveClass('md:rounded-[2.5rem]', 'border', 'border-white/10', 'bg-white/5', 'md:flex-row', 'md:justify-between')
      const tile = screen.getByTestId('google-tile')
      const button = screen.getByRole('link', { name: /avaliar a aguiar no google/i })
      const [first, last] = [card.firstElementChild!, card.lastElementChild!]
      expect(first).toContainElement(tile)
      expect(first).toContainElement(screen.getByText('Sua opinião leva a Aguiar mais longe'))
      expect(last).toBe(button)
    })

    it('puts the Google "G" in a white rounded square, like a small app icon', async () => {
      render(await Depoimentos({ client: fakeClient(testimonials) }))
      const tile = screen.getByTestId('google-tile')
      expect(tile).toHaveClass('h-16', 'w-16', 'rounded-2xl', 'bg-white')
      expect(tile).toHaveAttribute('aria-hidden', 'true')
      expect(tile.querySelector('svg')).toBeInTheDocument()
    })

    it('keeps the stars, the title and the text exactly as they were', async () => {
      render(await Depoimentos({ client: fakeClient(testimonials) }))
      const card = screen.getByTestId('google-cta')
      expect(within(card).getByText('★★★★★')).toHaveClass('text-lg', 'text-yellow-400')
      expect(screen.getByText('Sua opinião leva a Aguiar mais longe')).toHaveClass('text-xl', 'font-bold', 'md:text-2xl')
      expect(screen.getByText(/foi na aguiar veículos e gostou do atendimento\? conte pra nós como foi/i)).toBeInTheDocument()
    })

    it('keeps the button exactly as it was: the colored "G" before the label, no arrow', async () => {
      render(await Depoimentos({ client: fakeClient(testimonials) }))
      const button = screen.getByRole('link', { name: /avaliar a aguiar no google/i })
      expect(button.className.split(/\s+/).sort()).toEqual(
        ('inline-flex shrink-0 items-center justify-center gap-3 rounded-full px-7 py-3.5 text-sm font-bold uppercase ' +
          'tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
          'bg-white/10 text-white hover:bg-white hover:text-graphite focus-visible:outline-white').split(' ').sort(),
      )
      expect(within(button).queryByTestId('google-arrow')).not.toBeInTheDocument()
      const icon = button.querySelector('svg')!
      expect(button.querySelectorAll('svg')).toHaveLength(1)
      expect(icon.parentElement).toHaveClass('h-6', 'w-6')
      // The "G" comes first, then the label.
      expect(button.firstElementChild).toBe(icon.parentElement)
    })
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
    const panel = screen.getByTestId('google-cta')
    expect(panel).toHaveClass('bg-white')
    expect(title).not.toHaveClass('text-white')
    expect(screen.getByText(/foi na aguiar veículos e gostou do atendimento/i)).toHaveClass('text-graphite/70')
    const link = screen.getByRole('link', { name: /avaliar a aguiar no google/i })
    expect(link).toHaveClass('bg-graphite/5', 'text-graphite', 'hover:bg-graphite', 'hover:text-white')
    expect(link.className).not.toMatch(/(^|\s)border(-|\s|$)/)
  })
})
