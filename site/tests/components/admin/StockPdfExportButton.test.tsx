import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { buildStockPdf, save } = vi.hoisted(() => ({ buildStockPdf: vi.fn(), save: vi.fn() }))
vi.mock('@/lib/stock-pdf', () => ({ buildStockPdf: buildStockPdf.mockReturnValue({ save }) }))

import { StockPdfExportButton } from '@/components/admin/StockPdfExportButton'

describe('StockPdfExportButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates a PDF with only the default columns when no checkbox is checked', () => {
    render(<StockPdfExportButton vehicles={[]} totalCostCentsByVehicleId={{}} />)
    fireEvent.click(screen.getByRole('button', { name: /exportar pdf/i }))
    fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))

    expect(buildStockPdf).toHaveBeenCalledWith([], {}, {
      includeDays: false, includeCost: false, includeMargin: false, includeFipe: false,
    })
    expect(save).toHaveBeenCalled()
  })

  it('passes the checked optional columns through to buildStockPdf', () => {
    render(<StockPdfExportButton vehicles={[]} totalCostCentsByVehicleId={{}} />)
    fireEvent.click(screen.getByRole('button', { name: /exportar pdf/i }))
    fireEvent.click(screen.getByLabelText(/dias em estoque/i))
    fireEvent.click(screen.getByLabelText(/valor fipe/i))
    fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))

    expect(buildStockPdf).toHaveBeenCalledWith([], {}, {
      includeDays: true, includeCost: false, includeMargin: false, includeFipe: true,
    })
  })

  it('closes the checkbox panel after generating the PDF', () => {
    render(<StockPdfExportButton vehicles={[]} totalCostCentsByVehicleId={{}} />)
    fireEvent.click(screen.getByRole('button', { name: /exportar pdf/i }))
    fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))
    expect(screen.queryByRole('button', { name: /gerar pdf/i })).not.toBeInTheDocument()
  })
})
