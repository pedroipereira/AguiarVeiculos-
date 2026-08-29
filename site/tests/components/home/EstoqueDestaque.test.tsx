import { render, screen } from '@testing-library/react'
import { EstoqueDestaque } from '@/components/home/EstoqueDestaque'

function fakeClient(rows: any[]) {
  const chain: any = {
    select: () => chain, eq: () => chain, order: () => chain,
    limit: async () => ({ data: rows, error: null }),
  }
  return { from: () => chain } as any
}

describe('EstoqueDestaque', () => {
  it('renders a card per featured vehicle with brand, model and price', async () => {
    const client = fakeClient([
      { id: '1', slug: 'vw-polo-2026', brand: 'Volkswagen', model: 'Polo', version: 'Comfortline', year_model: 2026, price_cents: 8990000 },
    ])
    render(await EstoqueDestaque({ client }))
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.getByText('R$ 89.900')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver todo o estoque/i })).toHaveAttribute('href', '/estoque')
  })

  it('renders nothing visible when there are no featured vehicles', async () => {
    const client = fakeClient([])
    const { container } = render(await EstoqueDestaque({ client }))
    expect(container).toBeEmptyDOMElement()
  })
})
