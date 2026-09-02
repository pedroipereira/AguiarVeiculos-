import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { vi } from 'vitest'
import { VehicleDatePicker } from '@/components/admin/VehicleDatePicker'

function Controlled({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <VehicleDatePicker id="acquiredAt" value={value} onChange={setValue} />
}

describe('VehicleDatePicker', () => {
  it('shows a placeholder when no date is selected', () => {
    render(<Controlled />)
    expect(screen.getByRole('button', { name: /selecione a data/i })).toBeInTheDocument()
  })

  it('shows the selected date formatted as pt-BR', () => {
    render(<Controlled initial="2026-08-01" />)
    expect(screen.getByRole('button', { name: /01\/08\/2026/ })).toBeInTheDocument()
  })

  it('opens a calendar on click and picks a day, formatting the trigger and calling onChange', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T12:00:00.000Z'))
    try {
      render(<Controlled />)
      fireEvent.click(screen.getByRole('button', { name: /selecione a data/i }))
      expect(screen.getByText('Agosto 2026')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: '20' }))

      expect(screen.getByRole('button', { name: /20\/08\/2026/ })).toBeInTheDocument()
      expect(screen.queryByText('Agosto 2026')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('navigates to the next and previous month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T12:00:00.000Z'))
    try {
      render(<Controlled />)
      fireEvent.click(screen.getByRole('button', { name: /selecione a data/i }))
      expect(screen.getByText('Agosto 2026')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /próximo mês/i }))
      expect(screen.getByText('Setembro 2026')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /mês anterior/i }))
      fireEvent.click(screen.getByRole('button', { name: /mês anterior/i }))
      expect(screen.getByText('Julho 2026')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes the calendar when clicking outside', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T12:00:00.000Z'))
    try {
      render(<Controlled />)
      fireEvent.click(screen.getByRole('button', { name: /selecione a data/i }))
      expect(screen.getByText('Agosto 2026')).toBeInTheDocument()

      fireEvent.mouseDown(document.body)

      expect(screen.queryByText('Agosto 2026')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes itself when a different picker is opened, in the same click that opens the other one', () => {
    function TwoPickers() {
      const [a, setA] = useState('')
      const [b, setB] = useState('')
      return (
        <>
          <VehicleDatePicker id="a" value={a} onChange={setA} />
          <VehicleDatePicker id="b" value={b} onChange={setB} />
        </>
      )
    }

    render(<TwoPickers />)
    const [triggerA, triggerB] = screen.getAllByRole('button', { name: /selecione a data/i })

    fireEvent.click(triggerA)
    expect(screen.getAllByLabelText(/mês anterior/i)).toHaveLength(1)

    // A real click is mousedown-then-click; the outside-close listener relies
    // on mousedown, so a bare fireEvent.click (which skips it) can't exercise
    // this the way an actual user gesture would.
    fireEvent.mouseDown(triggerB)
    fireEvent.click(triggerB)
    expect(screen.getAllByLabelText(/mês anterior/i)).toHaveLength(1)
  })
})
