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

import { VehicleFilters } from '@/components/catalog/VehicleFilters'

describe('VehicleFilters', () => {
  beforeEach(() => { push.mockClear(); currentParams.value = '' })

  it('renders brand, year and price range inputs (spec requires all three filters)', () => {
    render(<VehicleFilters />)
    expect(screen.getByLabelText('Filtrar por marca')).toBeInTheDocument()
    expect(screen.getByLabelText('Filtrar por ano')).toBeInTheDocument()
    expect(screen.getByLabelText('Preço mínimo')).toBeInTheDocument()
    expect(screen.getByLabelText('Preço máximo')).toBeInTheDocument()
  })

  it('pushes the brand filter as typed', () => {
    render(<VehicleFilters />)
    fireEvent.blur(screen.getByLabelText('Filtrar por marca'), { target: { value: 'fiat' } })
    expect(push).toHaveBeenCalledWith('/estoque?brand=fiat')
  })

  it('converts the minimum price from reais to cents', () => {
    render(<VehicleFilters />)
    fireEvent.blur(screen.getByLabelText('Preço mínimo'), { target: { value: '50000' } })
    expect(push).toHaveBeenCalledWith('/estoque?minPrice=5000000')
  })

  it('converts the maximum price from reais to cents', () => {
    render(<VehicleFilters />)
    fireEvent.blur(screen.getByLabelText('Preço máximo'), { target: { value: '90000' } })
    expect(push).toHaveBeenCalledWith('/estoque?maxPrice=9000000')
  })

  it('clears the price filter when the field is emptied', () => {
    currentParams.value = 'minPrice=5000000'
    render(<VehicleFilters />)
    fireEvent.blur(screen.getByLabelText('Preço mínimo'), { target: { value: '' } })
    expect(push).toHaveBeenCalledWith('/estoque?')
  })

  it('shows the active price filter back in reais', () => {
    currentParams.value = 'minPrice=5000000&maxPrice=9000000'
    render(<VehicleFilters />)
    expect(screen.getByLabelText('Preço mínimo')).toHaveValue(50000)
    expect(screen.getByLabelText('Preço máximo')).toHaveValue(90000)
  })
})
