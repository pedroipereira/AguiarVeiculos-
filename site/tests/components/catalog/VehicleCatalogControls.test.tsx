import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { push, currentParams } = vi.hoisted(() => ({
  push: vi.fn(),
  currentParams: { value: '' },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(currentParams.value),
}))

import { VehicleCatalogControls } from '@/components/catalog/VehicleCatalogControls'

const filtersProps = {
  brands: [{ brand: 'Fiat', count: 4 }],
  minPriceCents: 3000000,
  mileageRangeKm: { min: 0, max: 150000 },
  transmissions: ['Automático', 'Manual'],
  fuelTypes: ['Flex', 'Diesel'],
  resultCount: 12,
}

describe('VehicleCatalogControls', () => {
  beforeEach(() => {
    push.mockClear()
    currentParams.value = ''
  })

  it('opens the filters panel when the Filtros button in the search/sort bar is clicked', () => {
    render(
      <VehicleCatalogControls filtersProps={filtersProps} resultCount={12} allVehicles={[]} allVehicleImageUrls={{}}>
        <p>vehicle grid</p>
      </VehicleCatalogControls>,
    )
    const toggle = screen.getByRole('button', { name: /^Filtros/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders the children (vehicle grid) alongside the search/sort bar', () => {
    render(
      <VehicleCatalogControls filtersProps={filtersProps} resultCount={12} allVehicles={[]} allVehicleImageUrls={{}}>
        <p>vehicle grid</p>
      </VehicleCatalogControls>,
    )
    expect(screen.getByText('vehicle grid')).toBeInTheDocument()
  })
})
