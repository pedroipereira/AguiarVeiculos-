'use client'

import { VEHICLE_EXPENSE_CATEGORIES } from '@/lib/vehicle-costs'
import type { VehicleExpenseCategory } from '@/lib/types'
import { formatPriceFromCents } from '@/lib/format'

export interface DraftVehicleExpense {
  category: VehicleExpenseCategory
  description: string
  amountReais: string
}

interface VehicleExpensesEditorProps {
  expenses: DraftVehicleExpense[]
  onChange: (expenses: DraftVehicleExpense[]) => void
}

const inputClass =
  'rounded-lg border border-support-gray/25 p-2 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none'

export function VehicleExpensesEditor({ expenses, onChange }: VehicleExpensesEditorProps) {
  function addExpense() {
    onChange([...expenses, { category: 'pintura', description: '', amountReais: '' }])
  }

  function updateExpense(index: number, patch: Partial<DraftVehicleExpense>) {
    onChange(expenses.map((expense, i) => (i === index ? { ...expense, ...patch } : expense)))
  }

  function removeExpense(index: number) {
    onChange(expenses.filter((_, i) => i !== index))
  }

  const totalCents = expenses.reduce((sum, expense) => sum + Math.round((Number(expense.amountReais) || 0) * 100), 0)

  return (
    <div className="flex flex-col gap-3">
      {expenses.map((expense, index) => (
        <div key={index} className="grid grid-cols-1 gap-2 rounded-lg bg-support-gray/5 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            aria-label={`Categoria do gasto ${index + 1}`}
            value={expense.category}
            onChange={(e) => updateExpense(index, { category: e.target.value as VehicleExpenseCategory })}
            className={inputClass}
          >
            {VEHICLE_EXPENSE_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {expense.category === 'outros' && (
            <input
              aria-label={`Descrição do gasto ${index + 1}`}
              value={expense.description}
              onChange={(e) => updateExpense(index, { description: e.target.value })}
              placeholder="Descreva o gasto"
              className={inputClass}
            />
          )}
          <input
            aria-label={`Valor do gasto ${index + 1}`}
            type="number"
            value={expense.amountReais}
            onChange={(e) => updateExpense(index, { amountReais: e.target.value })}
            placeholder="Valor (R$)"
            className={inputClass}
          />
          <button type="button" onClick={() => removeExpense(index)} className="text-sm text-aguiar-red hover:underline">
            Remover
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addExpense}
        className="self-start rounded-lg border border-support-gray/25 px-4 py-2 text-sm font-bold text-graphite hover:border-graphite"
      >
        + Adicionar gasto
      </button>

      <p className="text-sm text-support-gray">Total de gastos: {formatPriceFromCents(totalCents)}</p>
    </div>
  )
}
