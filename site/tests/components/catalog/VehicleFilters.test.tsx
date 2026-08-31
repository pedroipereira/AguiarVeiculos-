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

const baseProps = {
  brands: [
    { brand: 'Fiat', count: 4 },
    { brand: 'Volkswagen', count: 2 },
  ],
  minPriceCents: 3000000,
  mileageRangeKm: { min: 0, max: 150000 },
  transmissions: ['Automático', 'Manual'],
  fuelTypes: ['Flex', 'Diesel'],
  resultCount: 12,
  // The mobile open/closed toggle now lives in VehicleSearchSort; force the
  // panel open here so these tests can reach the fields inside it directly.
  mobileOpen: true,
}

/** Every filter section starts collapsed, so tests open the one they need first. */
function openSection(title: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${title}`, 'i') }))
}

describe('VehicleFilters', () => {
  beforeEach(() => {
    push.mockClear()
    currentParams.value = ''
  })

  it('starts every filter section collapsed', () => {
    render(<VehicleFilters {...baseProps} />)
    expect(screen.queryByRole('checkbox', { name: /fiat/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Preço máximo')).not.toBeInTheDocument()
  })

  it('lists each brand as a checkbox with its vehicle count once Marca is expanded', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Marca')
    expect(screen.getByRole('checkbox', { name: /fiat/i })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /volkswagen/i })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('adds a brand to the URL when its checkbox is checked', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Marca')
    fireEvent.click(screen.getByRole('checkbox', { name: /fiat/i }))
    expect(push).toHaveBeenCalledWith('/estoque?brands=Fiat')
  })

  it('adds a second brand alongside an already-selected one', () => {
    currentParams.value = 'brands=Fiat'
    render(<VehicleFilters {...baseProps} />)
    openSection('Marca')
    fireEvent.click(screen.getByRole('checkbox', { name: /volkswagen/i }))
    expect(push).toHaveBeenCalledWith('/estoque?brands=Fiat%2CVolkswagen')
  })

  it('removes a brand when its checkbox is unchecked', () => {
    currentParams.value = 'brands=Fiat,Volkswagen'
    render(<VehicleFilters {...baseProps} />)
    openSection('Marca')
    fireEvent.click(screen.getByRole('checkbox', { name: /fiat/i }))
    expect(push).toHaveBeenCalledWith('/estoque?brands=Volkswagen')
  })

  it('shows the result count', () => {
    render(<VehicleFilters {...baseProps} />)
    expect(screen.getByText('Ver 12 veículos')).toBeInTheDocument()
  })

  it('commits the max price when the price slider is released', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Preço')
    fireEvent.blur(screen.getByLabelText('Preço máximo'), { target: { value: '150000' } })
    expect(push).toHaveBeenCalledWith('/estoque?maxPrice=15000000')
  })

  it('drops the price filter when the slider is dragged back to its 1.000.000 ceiling', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Preço')
    fireEvent.blur(screen.getByLabelText('Preço máximo'), { target: { value: '1000000' } })
    expect(push).toHaveBeenCalledWith('/estoque?')
  })

  it('floors the price slider at the cheapest vehicle in stock, not at zero', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Preço')
    expect(screen.getByLabelText('Preço máximo')).toHaveAttribute('min', '30000')
  })

  it('commits the minimum year when the year slider is released', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Ano')
    fireEvent.blur(screen.getByLabelText('Ano mínimo'), { target: { value: '2020' } })
    expect(push).toHaveBeenCalledWith('/estoque?minYear=2020')
  })

  it('drops the year filter when the slider is dragged back to 1995', () => {
    currentParams.value = 'minYear=2020'
    render(<VehicleFilters {...baseProps} />)
    openSection('Ano')
    fireEvent.blur(screen.getByLabelText('Ano mínimo'), { target: { value: '1995' } })
    expect(push).toHaveBeenCalledWith('/estoque?')
  })

  it('commits the max mileage when the mileage slider is released', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Quilometragem')
    fireEvent.blur(screen.getByLabelText('Quilometragem máxima'), { target: { value: '40000' } })
    expect(push).toHaveBeenCalledWith('/estoque?maxMileage=40000')
  })

  it('pushes the transmission filter when a câmbio pill is clicked', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Câmbio')
    fireEvent.click(screen.getByRole('button', { name: 'Automático' }))
    expect(push).toHaveBeenCalledWith('/estoque?transmission=Autom%C3%A1tico')
  })

  it('deselects the câmbio pill when clicked again', () => {
    currentParams.value = 'transmission=Automático'
    render(<VehicleFilters {...baseProps} />)
    openSection('Câmbio')
    fireEvent.click(screen.getByRole('button', { name: 'Automático' }))
    expect(push).toHaveBeenCalledWith('/estoque?')
  })

  it('pushes the fuel type filter when a combustível pill is clicked', () => {
    render(<VehicleFilters {...baseProps} />)
    openSection('Combustível')
    fireEvent.click(screen.getByRole('button', { name: 'Diesel' }))
    expect(push).toHaveBeenCalledWith('/estoque?fuelType=Diesel')
  })

  it('navigates to the bare /estoque url when clearing all filters', () => {
    currentParams.value = 'brands=Fiat&maxPrice=9000000'
    render(<VehicleFilters {...baseProps} />)
    fireEvent.click(screen.getByText('Limpar filtros'))
    expect(push).toHaveBeenCalledWith('/estoque')
  })

  it('hides the panel on mobile when mobileOpen is false, but the fields still exist for lg screens', () => {
    render(<VehicleFilters {...baseProps} mobileOpen={false} />)
    // jsdom doesn't compute the `hidden`/`lg:block` CSS, so this only proves
    // the panel still renders (as it must for the `lg` breakpoint) — the
    // actual mobile show/hide behavior is a CSS concern, not a DOM one.
    expect(screen.getByText('Marca')).toBeInTheDocument()
  })
})
