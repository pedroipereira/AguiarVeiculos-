import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { VehicleExpensesEditor, type DraftVehicleExpense } from '@/components/admin/VehicleExpensesEditor'

function Harness({ initial = [] as DraftVehicleExpense[] }) {
  const [expenses, setExpenses] = useState<DraftVehicleExpense[]>(initial)
  return <VehicleExpensesEditor expenses={expenses} onChange={setExpenses} />
}

describe('VehicleExpensesEditor', () => {
  it('adds a new expense row with the "Adicionar gasto" button', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    expect(screen.getByLabelText(/categoria do gasto 1/i)).toBeInTheDocument()
  })

  it('shows the description field only when category is "Outros"', () => {
    render(<Harness initial={[{ category: 'pintura', description: '', amountReais: '' }]} />)
    expect(screen.queryByLabelText(/descrição do gasto 1/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/categoria do gasto 1/i), { target: { value: 'outros' } })
    expect(screen.getByLabelText(/descrição do gasto 1/i)).toBeInTheDocument()
  })

  it('removes an expense row', () => {
    render(<Harness initial={[{ category: 'pintura', description: '', amountReais: '100' }]} />)
    fireEvent.click(screen.getByRole('button', { name: /remover/i }))
    expect(screen.queryByLabelText(/categoria do gasto 1/i)).not.toBeInTheDocument()
  })

  it('shows the sum of all expense amounts', () => {
    render(<Harness initial={[
      { category: 'pintura', description: '', amountReais: '500' },
      { category: 'mecanica', description: '', amountReais: '250' },
    ]} />)
    expect(screen.getByText(/total de gastos: r\$ 750/i)).toBeInTheDocument()
  })
})
