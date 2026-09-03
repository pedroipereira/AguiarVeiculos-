import { render, screen } from '@testing-library/react'
import { VehicleOptionalsList } from '@/components/catalog/VehicleOptionalsList'

describe('VehicleOptionalsList', () => {
  it('renders a pill for each optional', () => {
    render(<VehicleOptionalsList optionals={['Ar condicionado', 'Central multimídia', 'Outros']} />)
    expect(screen.getByText('Ar condicionado')).toBeInTheDocument()
    expect(screen.getByText('Central multimídia')).toBeInTheDocument()
    expect(screen.getByText('Outros')).toBeInTheDocument()
  })

  it('renders nothing when the vehicle has no optionals marked', () => {
    const { container } = render(<VehicleOptionalsList optionals={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
