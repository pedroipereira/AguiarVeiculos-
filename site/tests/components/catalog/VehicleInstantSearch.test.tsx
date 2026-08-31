import { render, screen, fireEvent } from '@testing-library/react'
import { VehicleInstantSearch } from '@/components/catalog/VehicleInstantSearch'
import type { VehiclePublic } from '@/lib/types'

function makeVehicle(overrides: Partial<VehiclePublic>): VehiclePublic {
  return {
    id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: null,
    year_model: 2023, year_fabrication: 2023, mileage_km: 32000, price_cents: 6490000,
    fuel_type: 'Flex', transmission: 'Manual', color: 'Prata', description: null,
    engine: null, fuel_tank_liters: null, seating_capacity: null, body_type: null,
    doors: null, horsepower: null, is_featured: false, status: 'available',
    created_at: '', updated_at: '',
    ...overrides,
  }
}

const vehicles = [
  makeVehicle({ id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo' }),
  makeVehicle({ id: '2', slug: 'vw-polo-2026', brand: 'Volkswagen', model: 'Polo', year_model: 2026 }),
]

describe('VehicleInstantSearch', () => {
  it('does not show the overlay until the search bar is focused', () => {
    render(<VehicleInstantSearch vehicles={vehicles} imageUrls={{}} brands={['Fiat', 'Volkswagen']} />)
    expect(screen.queryByText('2 veículos no estoque')).not.toBeInTheDocument()
  })

  it('shows every vehicle in stock as soon as the search bar is focused', () => {
    render(<VehicleInstantSearch vehicles={vehicles} imageUrls={{}} brands={['Fiat', 'Volkswagen']} />)
    fireEvent.focus(screen.getByLabelText('Buscar marca ou modelo'))
    expect(screen.getByText('2 veículos no estoque')).toBeInTheDocument()
    expect(screen.getByText('Fiat Argo')).toBeInTheDocument()
    expect(screen.getByText('Volkswagen Polo')).toBeInTheDocument()
  })

  it('filters the list live as the user types', () => {
    render(<VehicleInstantSearch vehicles={vehicles} imageUrls={{}} brands={['Fiat', 'Volkswagen']} />)
    fireEvent.focus(screen.getByLabelText('Buscar marca ou modelo'))
    fireEvent.change(screen.getByLabelText('Buscar por marca, modelo ou ano'), { target: { value: 'polo' } })
    expect(screen.queryByText('Fiat Argo')).not.toBeInTheDocument()
    expect(screen.getByText('Volkswagen Polo')).toBeInTheDocument()
    expect(screen.getByText('1 veículo no estoque')).toBeInTheDocument()
  })

  it('filters the list when a brand pill is selected', () => {
    render(<VehicleInstantSearch vehicles={vehicles} imageUrls={{}} brands={['Fiat', 'Volkswagen']} />)
    fireEvent.focus(screen.getByLabelText('Buscar marca ou modelo'))
    fireEvent.click(screen.getByRole('button', { name: 'Fiat' }))
    expect(screen.getByText('Fiat Argo')).toBeInTheDocument()
    expect(screen.queryByText('Volkswagen Polo')).not.toBeInTheDocument()
  })

  it('links each result straight to its vehicle detail page', () => {
    render(<VehicleInstantSearch vehicles={vehicles} imageUrls={{}} brands={['Fiat', 'Volkswagen']} />)
    fireEvent.focus(screen.getByLabelText('Buscar marca ou modelo'))
    expect(screen.getByText('Fiat Argo').closest('a')).toHaveAttribute('href', '/estoque/fiat-argo-2023')
  })

  it('closes the overlay when the close button is clicked', () => {
    render(<VehicleInstantSearch vehicles={vehicles} imageUrls={{}} brands={['Fiat', 'Volkswagen']} />)
    fireEvent.focus(screen.getByLabelText('Buscar marca ou modelo'))
    expect(screen.getByText('2 veículos no estoque')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Fechar busca'))
    expect(screen.queryByText('2 veículos no estoque')).not.toBeInTheDocument()
  })
})
