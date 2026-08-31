import { render, screen } from '@testing-library/react'
import { VehicleCard } from '@/components/catalog/VehicleCard'

const vehicle = {
  id: 'v1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive',
  year_model: 2023, year_fabrication: 2023, mileage_km: 32000, price_cents: 6490000,
  fuel_type: 'Flex', transmission: 'Manual', color: 'Prata', description: null,
  is_featured: false, status: 'available' as const, created_at: '', updated_at: '',
}

describe('VehicleCard', () => {
  it('renders the vehicle photo when there is one', () => {
    render(<VehicleCard vehicle={vehicle} imageUrl="https://cdn.test/argo.jpg" />)
    expect(screen.getByRole('img', { name: /fiat argo drive/i })).toHaveAttribute('src', 'https://cdn.test/argo.jpg')
    expect(screen.queryByTestId('vehicle-card-placeholder')).not.toBeInTheDocument()
  })

  it('renders a placeholder block instead of a broken image when there is no photo', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('vehicle-card-placeholder')).toBeInTheDocument()
  })

  it('links to the vehicle detail page and shows brand, year and price', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/estoque/fiat-argo-2023')
    expect(screen.getByText(/fiat argo drive/i)).toBeInTheDocument()
    expect(screen.getByText(/2023 • 32\.000 km/)).toBeInTheDocument()
    expect(screen.getByText('R$ 64.900')).toBeInTheDocument()
  })

  it('does not show a year badge over the photo', () => {
    render(<VehicleCard vehicle={vehicle} imageUrl="https://cdn.test/argo.jpg" />)
    expect(screen.queryByText('2023', { selector: 'span' })).not.toBeInTheDocument()
  })

  it('shows a photo-count badge when photoCount is provided', () => {
    render(<VehicleCard vehicle={vehicle} imageUrl="https://cdn.test/argo.jpg" photoCount={14} />)
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('hides the photo-count badge when there are no photos', () => {
    render(<VehicleCard vehicle={vehicle} photoCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('hides the photo-count badge when photoCount is not provided', () => {
    render(<VehicleCard vehicle={vehicle} imageUrl="https://cdn.test/argo.jpg" />)
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })
})
