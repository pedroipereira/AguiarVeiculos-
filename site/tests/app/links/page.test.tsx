import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

const { rows } = vi.hoisted(() => ({ rows: { current: [] as any[] } }))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: () => {
      const chain: any = { select: () => chain, order: async () => ({ data: rows.current, error: null }) }
      return chain
    },
  })),
}))

import LinksPage from '@/app/links/page'

describe('/links page', () => {
  beforeEach(() => { rows.current = [] })

  it('shows the logo and tagline', async () => {
    render(await LinksPage())
    expect(screen.getByAltText(/aguiar veículos/i)).toBeInTheDocument()
    expect(screen.getByText(/procedência e confiança/i)).toBeInTheDocument()
  })

  it('shows the four CTAs pointing at the right destinations', async () => {
    render(await LinksPage())
    expect(screen.getByRole('link', { name: /compre conosco/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    )
    expect(screen.getByRole('link', { name: /conheça nosso estoque/i })).toHaveAttribute('href', '/estoque')
    expect(screen.getByRole('link', { name: /onde estamos/i })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps'),
    )
    expect(screen.getByRole('link', { name: /avalie nosso atendimento/i })).toHaveAttribute(
      'href',
      'https://share.google/ORRbCwFxwIIYEz52A',
    )
  })

  it('links out to the real social profiles', async () => {
    render(await LinksPage())
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/aguiarveiculospk',
    )
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/aguiarveiculospdutra/?locale=pt_BR',
    )
  })

  it('shows the client photo carousel when there are published testimonials', async () => {
    rows.current = [{ id: '1', image_url: 'https://x/1.jpg', caption: 'Cliente feliz' }]
    render(await LinksPage())
    expect(screen.getByText(/sonhos que ganharam rodas/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cliente feliz' })).toHaveAttribute('src', 'https://x/1.jpg')
  })

  it('omits the carousel section when there are no published testimonials', async () => {
    render(await LinksPage())
    expect(screen.queryByText(/sonhos que ganharam rodas/i)).not.toBeInTheDocument()
  })
})
