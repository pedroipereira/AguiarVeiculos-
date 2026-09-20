import { render, screen, within } from '@testing-library/react'
import { Experiencia } from '@/components/home/Experiencia'

function fakeClient(value: string | null) {
  const chain: any = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: value ? { value } : null, error: null }) }
  return { from: () => chain } as any
}

describe('Experiencia', () => {
  it('invites people to live the Aguiar experience, and is where "Como chegar" lands', async () => {
    const { container } = render(await Experiencia({ client: fakeClient(null) }))
    expect(screen.getByText('Venha nos visitar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Venha viver a experiência Aguiar' })).toBeInTheDocument()
    expect(container.querySelector('section#como-chegar')).toBeInTheDocument()
  })

  it('invites in a natural voice, with the address and hours running inside the text', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const text = screen.getByTestId('experiencia-texto')
    expect(text).toHaveTextContent(/venha conhecer o nosso pátio de perto/i)
    expect(text).toHaveTextContent(/estamos localizados na Av\. Campo Dantas, 1689/i)
    expect(text).toHaveTextContent(/ao lado do posto full/i)
    expect(text).toHaveTextContent(/segunda a sexta, das 7h30 às 17h30/i)
    expect(text).toHaveTextContent(/sábados, das 8h às 13h/i)
    expect(text).toHaveTextContent(/chamar a gente no whatsapp pra agendar sua visita/i)
    expect(text).toHaveTextContent(/quem vai cuidar de você do começo ao fim/i)
  })

  it('keeps the title smaller, so it stops well before the video', async () => {
    render(await Experiencia({ client: fakeClient('https://example.com/como-chegar.mp4') }))
    const title = screen.getByRole('heading', { level: 2, name: 'Venha viver a experiência Aguiar' })
    expect(title).toHaveClass('text-3xl', 'md:text-4xl')
    expect(title).not.toHaveClass('md:text-5xl')
  })

  it('frames the vertical video in a rounded card on the left, with the text on the right', async () => {
    render(await Experiencia({ client: fakeClient('https://example.com/como-chegar.mp4') }))
    const frame = screen.getByTestId('experiencia-midia')
    expect(frame).toHaveClass('rounded-[2rem]', 'border', 'border-white/15', 'bg-white/5', 'p-2', 'max-w-[416px]')
    expect(frame).toContainElement(screen.getByTestId('location-video'))
    expect(screen.getByTestId('location-video')).toHaveClass('aspect-[9/16]', 'rounded-3xl')
    const column = screen.getByTestId('experiencia-texto').parentElement!
    expect(frame.compareDocumentPosition(column) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(frame.parentElement).toHaveClass('lg:items-center')
  })

  it('puts the label and the title at the top of the text column', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const column = screen.getByTestId('experiencia-texto').parentElement!
    expect(column).toContainElement(screen.getByText('Venha nos visitar'))
    expect(column).toContainElement(screen.getByRole('heading', { level: 2, name: 'Venha viver a experiência Aguiar' }))
  })

  it('organizes the same invitation as a short lead, three rows with icons and a closing line', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const text = screen.getByTestId('experiencia-texto')
    const [lead, closing] = [text.querySelector('p:first-of-type')!, text.querySelector('p:last-of-type')!]
    expect(lead).toHaveTextContent(
      'Venha conhecer o nosso pátio de perto, ver cada carro com calma e sentir na prática como é comprar na Aguiar.',
    )
    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      'Estamos localizados na Av. Campo Dantas, 1689, ao lado do Posto Full, na saída para São Domingos, prontos pra receber você.',
      'Funcionamos de segunda a sexta, das 7h30 às 17h30, e aos sábados, das 8h às 13h.',
      'Então é só escolher o dia e o horário que ficam melhores pra você e chamar a gente no WhatsApp pra agendar sua visita, que a gente deixa tudo pronto pra te receber.',
    ])
    for (const row of rows) expect(row.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(closing).toHaveTextContent(
      'Venha conhecer de perto quem vai cuidar de você do começo ao fim, com a atenção e o carinho que você merece.',
    )
  })

  it('goes back to the regular text size, with the paragraphs close together', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const text = screen.getByTestId('experiencia-texto')
    expect(text).toHaveClass('text-lg', 'max-w-xl')
    expect(text.className).not.toMatch(/text-2xl|text-\[1\.625rem\]|justify-between/)
  })

  it('sits on a light background when the page asks for it, with buttons and text readable on it', async () => {
    const { container } = render(await Experiencia({ client: fakeClient(null), tone: 'light' }))
    expect(container.querySelector('section#como-chegar')).toHaveClass('bg-white')
    expect(screen.getByRole('link', { name: 'Traçar rota' })).toHaveClass('border-graphite')
    expect(screen.getByRole('link', { name: 'Traçar rota' })).not.toHaveClass('text-white')
    expect(screen.getByTestId('experiencia-texto')).not.toHaveClass('text-white/90')
  })

  it('also reads well on the soft white', async () => {
    const { container } = render(await Experiencia({ client: fakeClient(null), tone: 'light-soft' }))
    expect(container.querySelector('section#como-chegar')).toHaveClass('bg-paper')
    expect(screen.getByRole('link', { name: 'Traçar rota' })).toHaveClass('border-graphite')
    expect(screen.getByTestId('experiencia-texto')).toHaveClass('text-graphite/80')
  })

  it('no longer shows the information cards, the tabs or the map', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    expect(screen.queryByText('Ponto de referência')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Mapa até a Aguiar Veículos')).not.toBeInTheDocument()
  })

  it('shows the video saved in the admin in vertical format', async () => {
    render(await Experiencia({ client: fakeClient('https://example.com/como-chegar.mp4') }))
    const video = screen.getByTestId('location-video')
    expect(video).toHaveAttribute('src', 'https://example.com/como-chegar.mp4')
    expect(video).toHaveClass('aspect-[9/16]')
    expect(screen.queryByAltText(/fachada/i)).not.toBeInTheDocument()
  })

  it('shows the store front, also vertical, while no video is saved', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    expect(screen.queryByTestId('location-video')).not.toBeInTheDocument()
    const photo = screen.getByAltText(/fachada da aguiar veículos/i)
    expect(photo).toHaveAttribute('src', '/images/fotos/showroom-fachada.jpg')
    expect(photo).toHaveClass('aspect-[9/16]')
  })

  it('fills the invitation out with connecting words, keeping the same meaning', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const text = screen.getByTestId('experiencia-texto')
    expect(text).toHaveTextContent(/ver cada carro com calma/i)
    expect(text).toHaveTextContent(/prontos pra receber você/i)
    expect(text).toHaveTextContent(
      /é só escolher o dia e o horário que ficam melhores pra você e chamar a gente no whatsapp pra agendar sua visita, que a gente deixa tudo pronto pra te receber/i,
    )
    expect(text).toHaveTextContent(/com a atenção e o carinho que você merece/i)
  })

  it('gives both visit buttons the same size, side by side', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const book = screen.getByRole('link', { name: 'Agendar minha visita' })
    const route = screen.getByRole('link', { name: 'Traçar rota' })
    for (const button of [book, route]) expect(button).toHaveClass('h-12', 'sm:w-64')
    expect(book.parentElement).toBe(route.parentElement)
    expect(book.parentElement).toHaveClass('flex', 'flex-wrap', 'gap-3')
  })

  it('offers the route and a WhatsApp message to book the visit', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    expect(screen.getByRole('link', { name: 'Traçar rota' })).toHaveAttribute('href', expect.stringContaining('maps/dir'))
    const whatsapp = screen.getByRole('link', { name: 'Agendar minha visita' })
    expect(whatsapp).toHaveAttribute('href', expect.stringContaining('wa.me'))
    expect(decodeURIComponent(whatsapp.getAttribute('href') ?? '')).toMatch(/agendar uma visita/i)
  })

  it('shows the rows as a plain list: the icon without a box, and thin lines between the rows', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const list = screen.getByRole('list')
    expect(list).toHaveClass('divide-y', 'divide-white/10')
    for (const row of within(list).getAllByRole('listitem')) {
      const icon = row.querySelector('[aria-hidden="true"]')!
      expect(icon).toHaveClass('text-aguiar-red')
      expect(icon.className).not.toMatch(/(^|\s)bg-|rounded-xl/)
    }
  })
})
