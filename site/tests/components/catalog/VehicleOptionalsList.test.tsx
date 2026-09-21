import { render, screen } from '@testing-library/react'
import { VehicleOptionalsList } from '@/components/catalog/VehicleOptionalsList'

describe('VehicleOptionalsList', () => {
  it('renders a pill for each optional', () => {
    render(<VehicleOptionalsList optionals={['Ar condicionado', 'Central multimídia', 'Outros']} />)
    expect(screen.getByText('Ar condicionado')).toBeInTheDocument()
    expect(screen.getByText('Central multimídia')).toBeInTheDocument()
    expect(screen.getByText('Outros')).toBeInTheDocument()
  })

  it('shows every optional the same way, "Outros" included, as an outlined pill with a check mark, not a solid red block', () => {
    render(<VehicleOptionalsList optionals={['Ar condicionado', 'Outros']} />)
    for (const name of ['Ar condicionado', 'Outros']) {
      const pill = screen.getByText(name)
      expect(pill).toHaveClass('border', 'border-white/20')
      expect(pill).not.toHaveClass('bg-aguiar-red')
      expect(pill.querySelector('svg')).not.toBeNull()
    }
  })

  it('always puts "Outros" last, wherever it was marked, keeping the order of the rest', () => {
    render(<VehicleOptionalsList optionals={['Ar condicionado', 'Outros', 'Bluetooth', 'Vidros elétricos']} />)
    const pills = Array.from(document.querySelectorAll('span')).map((pill) => pill.textContent)
    expect(pills).toEqual(['Ar condicionado', 'Bluetooth', 'Vidros elétricos', 'Outros'])
  })

  it('treats "outros" the same in any case, and keeps the list as it is when there is none', () => {
    const { unmount } = render(<VehicleOptionalsList optionals={[' outros ', 'ABS', 'Bluetooth']} />)
    expect(Array.from(document.querySelectorAll('span')).map((pill) => pill.textContent?.trim())).toEqual(['ABS', 'Bluetooth', 'outros'])
    unmount()
    render(<VehicleOptionalsList optionals={['Bluetooth', 'ABS']} />)
    expect(Array.from(document.querySelectorAll('span')).map((pill) => pill.textContent)).toEqual(['Bluetooth', 'ABS'])
  })

  it('renders nothing when the vehicle has no optionals marked', () => {
    const { container } = render(<VehicleOptionalsList optionals={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
