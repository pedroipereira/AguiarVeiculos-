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

  it('stacks the promises on a phone and puts the three side by side from the tablet up, so no space is left empty beside them', () => {
    const { container } = render(<VehicleTrustList />)
    const list = container.querySelector('ul')!
    expect(list).toHaveClass('flex', 'flex-col', 'md:grid', 'md:grid-cols-3', 'md:divide-x')
    for (const item of Array.from(list.querySelectorAll('li'))) expect(item).toHaveClass('md:px-5')
  })

  it('takes the extra classes it is given, so the page can make it as wide as the whole block', () => {
    const { container } = render(<VehicleTrustList className="lg:col-span-2" />)
    expect(container.querySelector('ul')).toHaveClass('lg:col-span-2')
  })
})
