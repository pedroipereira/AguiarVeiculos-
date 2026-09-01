import type { VehicleExpenseCategory } from './types'

export const VEHICLE_EXPENSE_CATEGORIES: { value: VehicleExpenseCategory; label: string }[] = [
  { value: 'pintura', label: 'Pintura' },
  { value: 'lavagem_higienizacao', label: 'Lavagem/Higienização' },
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'documentacao', label: 'Documentação' },
  { value: 'funilaria', label: 'Funilaria' },
  { value: 'outros', label: 'Outros' },
]

export function calculateTotalCostCents(
  acquisitionCostCents: number | null | undefined,
  expenses: { amount_cents: number }[],
): number {
  const acquisition = acquisitionCostCents ?? 0
  const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount_cents, 0)
  return acquisition + expensesTotal
}

export function calculateEstimatedMarginCents(priceCents: number, totalCostCents: number): number {
  return priceCents - totalCostCents
}

export function calculateRealizedMarginCents(
  salePriceCents: number | null | undefined,
  totalCostCents: number,
): number | null {
  if (salePriceCents == null) return null
  return salePriceCents - totalCostCents
}
