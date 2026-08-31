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

import { VehicleSearchSort } from '@/components/catalog/VehicleSearchSort'

const onToggleMobileFilters = vi.fn()

const baseProps = {
  allVehicles: [],
  allVehicleImageUrls: {},
  brandNames: [],
}

describe('VehicleSearchSort', () => {
  beforeEach(() => {
    push.mockClear()
    onToggleMobileFilters.mockClear()
    currentParams.value = ''
  })

  it('shows the result count', () => {
    render(<VehicleSearchSort {...baseProps} resultCount={7} mobileFiltersOpen={false} onToggleMobileFilters={onToggleMobileFilters} />)
    expect(screen.getByText('7 veículos')).toBeInTheDocument()
  })

  it('uses the singular form for a single result', () => {
    render(<VehicleSearchSort {...baseProps} resultCount={1} mobileFiltersOpen={false} onToggleMobileFilters={onToggleMobileFilters} />)
    expect(screen.getByText('1 veículo')).toBeInTheDocument()
  })

  it('opens the instant-search overlay when the search bar is focused', () => {
    render(<VehicleSearchSort {...baseProps} resultCount={0} mobileFiltersOpen={false} onToggleMobileFilters={onToggleMobileFilters} />)
    fireEvent.focus(screen.getByLabelText('Buscar marca ou modelo'))
    expect(screen.getByLabelText('Buscar por marca, modelo ou ano')).toBeInTheDocument()
  })

  it('pushes the sort option when changed', () => {
    render(<VehicleSearchSort {...baseProps} resultCount={0} mobileFiltersOpen={false} onToggleMobileFilters={onToggleMobileFilters} />)
    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'price_asc' } })
    expect(push).toHaveBeenCalledWith('/estoque?sort=price_asc')
  })

  it('calls onToggleMobileFilters and reflects the open state on the Filtros button', () => {
    const { rerender } = render(
      <VehicleSearchSort {...baseProps} resultCount={0} mobileFiltersOpen={false} onToggleMobileFilters={onToggleMobileFilters} />,
    )
    const toggle = screen.getByRole('button', { name: /^Filtros/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(onToggleMobileFilters).toHaveBeenCalledTimes(1)

    rerender(<VehicleSearchSort {...baseProps} resultCount={0} mobileFiltersOpen={true} onToggleMobileFilters={onToggleMobileFilters} />)
    expect(screen.getByRole('button', { name: /^Filtros/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows no active-filter badge when no filters are applied', () => {
    render(<VehicleSearchSort {...baseProps} resultCount={0} mobileFiltersOpen={false} onToggleMobileFilters={onToggleMobileFilters} />)
    expect(screen.getByRole('button', { name: /^Filtros/i })).toHaveTextContent('Filtros')
  })

  it('shows a count of active filter types on the Filtros button', () => {
    currentParams.value = 'brands=Fiat&maxPrice=9000000&transmission=Automático'
    render(<VehicleSearchSort {...baseProps} resultCount={0} mobileFiltersOpen={false} onToggleMobileFilters={onToggleMobileFilters} />)
    expect(screen.getByRole('button', { name: /^Filtros/i })).toHaveTextContent('Filtros3')
  })
})
