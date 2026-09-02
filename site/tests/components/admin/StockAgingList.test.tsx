import { render, screen } from '@testing-library/react'

import { StockAgingList } from '@/components/admin/StockAgingList'

const VEHICLES = [
  {
    id: 'v-1',
    brand: 'Peugeot',
    model: '208',
    version: '1.6 16v Allure Flex Aut. 5p',
    year_model: 2017,
    mileage_km: 70000,
    price_cents: 5670000,
    days: 13,
  },
  {
    id: 'v-2',
    brand: 'Chevrolet',
    model: 'Tracker',
    version: '1.2 Premier Turbo Aut. 5p',
    year_model: 2022,
    mileage_km: 60000,
    price_cents: 10459000,
    days: 5,
  },
]

describe('StockAgingList', () => {
  it('lists vehicles with their days in stock and a link to the full stock', () => {
    render(<StockAgingList vehicles={VEHICLES} />)

    expect(screen.getByText(/Peugeot 208/)).toBeInTheDocument()
    expect(screen.getByText('13d')).toBeInTheDocument()
    expect(screen.getByText('5d')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver estoque/i })).toHaveAttribute('href', '/admin/veiculos')
  })

  it('shows an empty state when there are no vehicles', () => {
    render(<StockAgingList vehicles={[]} />)
    expect(screen.getByText(/nenhum veículo dispon/i)).toBeInTheDocument()
  })
})
