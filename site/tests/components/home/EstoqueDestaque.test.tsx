import { render, screen } from '@testing-library/react'
import { EstoqueDestaque } from '@/components/home/EstoqueDestaque'

function fakeClient(rows: any[], imageRows: any[] = []) {
  const vehicleChain: any = {
    select: () => vehicleChain, eq: () => vehicleChain, order: () => vehicleChain,
    limit: async () => ({ data: rows, error: null }),
  }
  const imageChain: any = {
    select: () => imageChain, in: () => imageChain,
    order: async () => ({ data: imageRows, error: null }),
  }
  return {
    from: (table: string) => (table === 'vehicle_images' ? imageChain : vehicleChain),
    storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }) }) },
  } as any
}

const polo = {
  id: '1', slug: 'vw-polo-2026', brand: 'Volkswagen', model: 'Polo',
  version: 'Comfortline', year_model: 2026, price_cents: 8990000, mileage_km: 8000,
}

describe('EstoqueDestaque', () => {
  it('renders a card per featured vehicle with brand, model and price', async () => {
    const client = fakeClient([polo])
    render(await EstoqueDestaque({ client }))
    expect(screen.getByText(/volkswagen polo/i)).toBeInTheDocument()
    expect(screen.getByText('R$ 89.900')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /veja todos os nossos veículos/i })).toHaveAttribute('href', '/estoque')
  })

  it('renders the primary photo when the vehicle has images', async () => {
    const client = fakeClient([polo], [{ id: 'i1', vehicle_id: '1', storage_path: 'polo.jpg', display_order: 0 }])
    render(await EstoqueDestaque({ client }))
    expect(screen.getByRole('img', { name: /volkswagen polo/i })).toHaveAttribute('src', 'https://cdn.test/polo.jpg')
  })

  it('renders a placeholder instead of a broken image when the vehicle has no photo', async () => {
    const client = fakeClient([polo])
    render(await EstoqueDestaque({ client }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('vehicle-card-placeholder')).toBeInTheDocument()
  })

  it('renders nothing visible when there are no featured vehicles', async () => {
    const client = fakeClient([])
    const { container } = render(await EstoqueDestaque({ client }))
    expect(container).toBeEmptyDOMElement()
  })
})
