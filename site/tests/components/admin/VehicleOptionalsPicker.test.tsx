import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { VehicleOptionalsPicker } from '@/components/admin/VehicleOptionalsPicker'

function Harness({ initial = [] as string[] }) {
  const [selected, setSelected] = useState<string[]>(initial)
  return <VehicleOptionalsPicker selected={selected} onChange={setSelected} />
}

describe('VehicleOptionalsPicker', () => {
  it('renders every optional from the fixed catalog as a togglable pill', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Ar condicionado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blindagem' })).toBeInTheDocument()
  })

  it('marks a pill selected (aria-pressed) when clicked, and unselected when clicked again', () => {
    render(<Harness />)
    const pill = screen.getByRole('button', { name: 'Ar condicionado' })
    expect(pill).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-pressed', 'false')
  })

  it('starts with the pills matching the initially selected list', () => {
    render(<Harness initial={['Teto solar']} />)
    expect(screen.getByRole('button', { name: 'Teto solar' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Ar condicionado' })).toHaveAttribute('aria-pressed', 'false')
  })
})
