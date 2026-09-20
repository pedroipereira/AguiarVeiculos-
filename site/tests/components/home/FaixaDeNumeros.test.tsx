import { render, screen, within } from '@testing-library/react'
import { FaixaDeNumeros } from '@/components/home/FaixaDeNumeros'

describe('FaixaDeNumeros', () => {
  it('lists the four numbers the store already stands behind, each with a plain label', () => {
    render(<FaixaDeNumeros />)
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      '15+anos de mercado',
      '90 diasde garantia em motor e câmbio',
      '60xem financiamento, com bancos parceiros',
      '10+bancos parceiros para você financiar',
    ])
  })

  it('is a named region, so screen readers can jump to it', () => {
    render(<FaixaDeNumeros />)
    expect(screen.getByRole('region', { name: 'A Aguiar em números' })).toBeInTheDocument()
  })

  it('draws the numbers big and white, with a red mark between the items', () => {
    render(<FaixaDeNumeros />)
    const number = within(screen.getByRole('list')).getByText('15+')
    expect(number).toHaveClass('text-white', 'font-extrabold')
    expect(number.parentElement!.querySelector('.bg-aguiar-red')).toBeInTheDocument()
  })

  it('keeps the labels readable on the dark background', () => {
    render(<FaixaDeNumeros />)
    const label = within(screen.getByRole('list')).getByText('anos de mercado')
    expect(label).toHaveClass('text-white/85')
    expect(label).not.toHaveClass('text-support-gray')
  })

  it('has the same black as the sections around it, with a thin line above', () => {
    render(<FaixaDeNumeros />)
    expect(screen.getByRole('region')).toHaveClass('bg-graphite', 'border-t', 'border-white/10')
  })

  describe('rolling across the screen', () => {
    it('slides sideways in a loop, so the strip never ends', () => {
      render(<FaixaDeNumeros />)
      const track = screen.getByTestId('faixa-track')
      expect(track).toHaveClass('motion-safe:animate-marquee')
    })

    it('stops while the visitor is pointing at it, so the numbers can be read', () => {
      render(<FaixaDeNumeros />)
      expect(screen.getByTestId('faixa-track')).toHaveClass('hover:[animation-play-state:paused]')
    })

    it('repeats the numbers to fill the width, but screen readers only read them once', () => {
      render(<FaixaDeNumeros />)
      const track = screen.getByTestId('faixa-track')
      const lists = track.querySelectorAll('ul')
      expect(lists.length).toBe(4)
      expect(lists[0]).not.toHaveAttribute('aria-hidden')
      for (const copy of [lists[1], lists[2], lists[3]]) expect(copy).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getAllByRole('listitem')).toHaveLength(4)
    })

    it('for visitors who ask for less motion, stands still: one copy, wrapped and centered', () => {
      render(<FaixaDeNumeros />)
      const track = screen.getByTestId('faixa-track')
      expect(track).toHaveClass('motion-reduce:w-full', 'motion-reduce:flex-wrap', 'motion-reduce:justify-center')
      for (const copy of [...track.querySelectorAll('ul')].slice(1)) expect(copy).toHaveClass('motion-reduce:hidden')
    })
  })

  describe('the size of the strip', () => {
    it('is a slim strip: less space above and below the numbers', () => {
      render(<FaixaDeNumeros />)
      const strip = screen.getByRole('region')
      expect(strip).toHaveClass('py-6')
      expect(strip).not.toHaveClass('py-9')
    })

    it('draws the numbers and the labels smaller', () => {
      render(<FaixaDeNumeros />)
      const list = within(screen.getByRole('list'))
      expect(list.getByText('15+')).toHaveClass('text-3xl', 'md:text-4xl')
      expect(list.getByText('15+')).not.toHaveClass('md:text-5xl')
      expect(list.getByText('anos de mercado')).toHaveClass('text-sm', 'md:text-base')
      expect(list.getByText('anos de mercado')).not.toHaveClass('md:text-lg')
    })
  })
})
