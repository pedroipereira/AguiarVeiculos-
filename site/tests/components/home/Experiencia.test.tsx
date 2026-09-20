import { render, screen } from '@testing-library/react'
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
    expect(text).toHaveTextContent(/chame a gente no whatsapp pra agendar sua visita/i)
    expect(text).toHaveTextContent(/quem vai cuidar de você do começo ao fim/i)
  })

  it('stacks the invitation in a narrow column of short paragraphs, leaving the room to the video', async () => {
    render(await Experiencia({ client: fakeClient('https://example.com/como-chegar.mp4') }))
    const text = screen.getByTestId('experiencia-texto')
    expect(text).toHaveClass('max-w-sm')
    expect(text.querySelectorAll('p').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByTestId('location-video')).toHaveClass('max-w-[400px]')
  })

  it('sits on a light background when the page asks for it, with buttons and text readable on it', async () => {
    const { container } = render(await Experiencia({ client: fakeClient(null), tone: 'light' }))
    expect(container.querySelector('section#como-chegar')).toHaveClass('bg-white')
    expect(screen.getByRole('link', { name: 'Traçar rota' })).toHaveClass('border-graphite')
    expect(screen.getByRole('link', { name: 'Traçar rota' })).not.toHaveClass('text-white')
    expect(screen.getByTestId('experiencia-texto')).not.toHaveClass('text-white/80')
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
      /então é só escolher o dia e horário que fica melhor pra você e chame a gente no whatsapp pra agendar sua visita, que a gente deixa tudo pronto pra te receber/i,
    )
    expect(text).toHaveTextContent(/com a atenção e o carinho que você merece/i)
  })

  it('gives both visit buttons the same size', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    const book = screen.getByRole('link', { name: 'Agendar minha visita' })
    const route = screen.getByRole('link', { name: 'Traçar rota' })
    for (const button of [book, route]) {
      expect(button).toHaveClass('w-full')
      expect(button).toHaveClass('h-12')
    }
    expect(book.parentElement).toBe(route.parentElement)
    expect(book.parentElement).toHaveClass('sm:max-w-[260px]')
  })

  it('offers the route and a WhatsApp message to book the visit', async () => {
    render(await Experiencia({ client: fakeClient(null) }))
    expect(screen.getByRole('link', { name: 'Traçar rota' })).toHaveAttribute('href', expect.stringContaining('maps/dir'))
    const whatsapp = screen.getByRole('link', { name: 'Agendar minha visita' })
    expect(whatsapp).toHaveAttribute('href', expect.stringContaining('wa.me'))
    expect(decodeURIComponent(whatsapp.getAttribute('href') ?? '')).toMatch(/agendar uma visita/i)
  })
})
