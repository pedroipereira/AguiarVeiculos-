import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminSetSiteSetting } = vi.hoisted(() => ({ adminSetSiteSetting: vi.fn() }))
vi.mock('@/app/actions/site-settings', () => ({ adminSetSiteSetting }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { StockTurnoverCard } from '@/components/admin/StockTurnoverCard'

describe('StockTurnoverCard', () => {
  it('shows the average days in stock and the stale-vehicle count', () => {
    render(<StockTurnoverCard avgDays={27} availableCount={17} staleCount={3} thresholdDays={90} />)

    expect(screen.getByText('27d')).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '3 carros parados há mais de 90 dias')).toBeInTheDocument()
  })

  it('uses singular wording for a single stale vehicle', () => {
    render(<StockTurnoverCard avgDays={10} availableCount={5} staleCount={1} thresholdDays={90} />)
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '1 carro parado há mais de 90 dias')).toBeInTheDocument()
  })

  it('saves a new threshold and refreshes the page', async () => {
    render(<StockTurnoverCard avgDays={27} availableCount={17} staleCount={3} thresholdDays={90} />)

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    fireEvent.change(screen.getByLabelText(/considerar parado a partir de/i), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('stock_turnover_threshold_days', '60'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })
})
