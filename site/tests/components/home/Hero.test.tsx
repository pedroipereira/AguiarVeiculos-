import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/home/Hero'

describe('Hero', () => {
  it('shows the eyebrow, headline with the highlighted word, and both CTAs', () => {
    render(<Hero />)
    expect(screen.getByText(/aguiar veículos • novos e seminovos/i)).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/confiança/i)
    expect(screen.getByText('confiança.')).toHaveClass('text-aguiar-red')
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })

  it('keeps the paragraph over the photo readable: light text, not the dim gray', () => {
    render(<Hero />)
    const paragraph = screen.getByText(/cada carro é escolhido com cuidado/i)
    expect(paragraph).toHaveClass('text-white/90')
    expect(paragraph).not.toHaveClass('text-support-gray')
  })

  it('fades its bottom edge into the page black, so the photo blends into the next section', () => {
    render(<Hero />)
    const fade = screen.getByTestId('hero-fade')
    expect(fade).toHaveClass('bg-gradient-to-b', 'from-transparent', 'to-graphite', 'bottom-0')
    expect(fade).toHaveAttribute('aria-hidden', 'true')
    expect(fade).toHaveClass('pointer-events-none')
  })

  it('shows the whole portrait photo on a phone (a 3:4 block, no side crop) and fills the section from the tablet up', () => {
    const { container } = render(<Hero imageUrl="/foto.jpg" />)
    const photo = container.querySelector('img')!
    expect(photo).toHaveClass('object-cover', 'md:object-[center_38%]')
    const frame = photo.parentElement!
    expect(frame).toHaveClass('aspect-[3/4]', 'md:absolute', 'md:inset-0', 'md:aspect-auto')
  })

  describe('on a phone', () => {
    it('makes the headline a size smaller, so the buttons stay in view', () => {
      render(<Hero />)
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveClass('text-4xl', 'md:text-5xl')
      expect(title).not.toHaveClass('text-5xl')
    })

    it('stacks the two buttons at full width, so neither hides under the floating WhatsApp', () => {
      render(<Hero />)
      const stock = screen.getByRole('link', { name: /ver estoque/i })
      const whatsapp = screen.getByRole('link', { name: /falar no whatsapp/i })
      expect(stock.parentElement).toBe(whatsapp.parentElement)
      expect(stock.parentElement).toHaveClass('flex-col', 'sm:flex-row', 'w-full', 'sm:w-auto')
      for (const button of [stock, whatsapp]) expect(button).toHaveClass('w-full', 'sm:w-auto')
    })
  })
})
