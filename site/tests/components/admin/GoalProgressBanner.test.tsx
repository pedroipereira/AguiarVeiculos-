import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminSetSiteSetting } = vi.hoisted(() => ({ adminSetSiteSetting: vi.fn() }))
vi.mock('@/app/actions/site-settings', () => ({ adminSetSiteSetting }))

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { GoalProgressBanner } from '@/components/admin/GoalProgressBanner'

const NOW = new Date(2026, 8, 1)

describe('GoalProgressBanner', () => {
  it('shows progress when a goal is set', () => {
    render(<GoalProgressBanner soldCount={12} goal={20} now={NOW} />)
    expect(screen.getByText('12 de 20 vendas')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText(/Faltam 8 em 22 dias úteis/)).toBeInTheDocument()
  })

  it('shows an empty state when no goal is set', () => {
    render(<GoalProgressBanner soldCount={12} goal={null} now={NOW} />)
    expect(screen.getByText('Nenhuma meta definida para este mês')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /definir meta/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^editar meta$/i })).not.toBeInTheDocument()
  })

  it('saves a new goal and refreshes the page', async () => {
    render(<GoalProgressBanner soldCount={12} goal={20} now={NOW} />)

    fireEvent.click(screen.getByRole('button', { name: /editar meta/i }))
    fireEvent.change(screen.getByLabelText(/meta de vendas do mês/i), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('monthly_sales_goal', '25'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })
})
