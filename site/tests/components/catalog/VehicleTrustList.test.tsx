import { render, screen } from '@testing-library/react'
import { VehicleTrustList } from '@/components/catalog/VehicleTrustList'

describe('VehicleTrustList', () => {
  it('lists the three promises the home page already makes about every car, each with an icon', () => {
    const { container } = render(<VehicleTrustList />)
    expect(screen.getByText('90 dias de garantia para motor e câmbio')).toBeInTheDocument()
    expect(screen.getByText('Revisado e higienizado')).toBeInTheDocument()
    expect(screen.getByText('Em nome da loja até a transferência')).toBeInTheDocument()
    expect(container.querySelectorAll('li svg')).toHaveLength(3)
  })
})
