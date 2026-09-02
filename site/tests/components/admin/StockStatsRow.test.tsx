import { render, screen } from '@testing-library/react'

import { StockStatsRow } from '@/components/admin/StockStatsRow'

describe('StockStatsRow', () => {
  it('shows the available, no-margin and stale counts', () => {
    render(<StockStatsRow availableCount={17} noMarginCount={10} staleCount={0} thresholdDays={90} />)

    expect(screen.getByText('Disponíveis')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
    expect(screen.getByText('Sem margem')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Parados +90d')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('reflects a custom turnover threshold in the stale-stat label', () => {
    render(<StockStatsRow availableCount={5} noMarginCount={1} staleCount={2} thresholdDays={60} />)
    expect(screen.getByText('Parados +60d')).toBeInTheDocument()
  })
})
