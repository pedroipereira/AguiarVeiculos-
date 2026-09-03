import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminMarkVehicleSold } = vi.hoisted(() => ({ adminMarkVehicleSold: vi.fn() }))
vi.mock('@/app/actions/vehicles', () => ({ adminMarkVehicleSold }))

import { VehicleSaleForm } from '@/components/admin/VehicleSaleForm'

const leads = [
  { id: 'lead-1', type: 'financing', name: 'Maria Souza', phone: '11999990000', details: null, vehicle_id: null, created_at: '2026-08-01' },
] as any

// VehicleDatePicker opens on the real wall-clock month when no date is
// selected yet, so the system clock is pinned to August 2026 for the
// duration of this click only — fake timers must not still be active
// during an async submit/waitFor afterward, or Testing Library's polling
// never fires.
function selectSaleDate(day = '31') {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 7, 15))
  try {
    fireEvent.click(screen.getByLabelText(/data da venda/i))
    fireEvent.click(screen.getByRole('button', { name: day }))
  } finally {
    vi.useRealTimers()
  }
}

describe('VehicleSaleForm', () => {
  beforeEach(() => { adminMarkVehicleSold.mockReset() })

  it('submits sale price, date, and buyer to adminMarkVehicleSold', async () => {
    adminMarkVehicleSold.mockResolvedValue(undefined)
    const onSaved = vi.fn()
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={onSaved} />)

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    selectSaleDate('31')
    fireEvent.change(screen.getByLabelText(/comprador/i), { target: { value: 'lead-1' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    await waitFor(() => expect(adminMarkVehicleSold).toHaveBeenCalledWith('v-1', {
      salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: 'lead-1',
    }))
    expect(onSaved).toHaveBeenCalled()
  })

  it('submits without a buyer when none is selected', async () => {
    adminMarkVehicleSold.mockResolvedValue(undefined)
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    selectSaleDate('31')
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    await waitFor(() => expect(adminMarkVehicleSold).toHaveBeenCalledWith('v-1', {
      salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: undefined,
    }))
  })

  it('shows an error and does not call onSaved when the sale date is missing', async () => {
    const onSaved = vi.fn()
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={onSaved} />)

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    expect(await screen.findByText(/escolha a data da venda/i)).toBeInTheDocument()
    expect(adminMarkVehicleSold).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('shows an error and does not call onSaved when the action rejects', async () => {
    adminMarkVehicleSold.mockRejectedValue(new Error('boom'))
    const onSaved = vi.fn()
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={onSaved} />)

    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '62000' } })
    selectSaleDate('31')
    fireEvent.click(screen.getByRole('button', { name: /confirmar venda/i }))

    expect(await screen.findByText(/não foi possível registrar a venda/i)).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('calls onCancel when "Cancelar" is clicked', () => {
    const onCancel = vi.fn()
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={onCancel} onSaved={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('pre-selects the buyer when defaultBuyerLeadId is given', () => {
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} defaultBuyerLeadId="lead-1" onCancel={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByLabelText(/comprador/i)).toHaveValue('lead-1')
  })

  it('gives the confirm and cancel buttons equal width', () => {
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByRole('button', { name: /confirmar venda/i })).toHaveClass('flex-1')
    expect(screen.getByRole('button', { name: /cancelar/i })).toHaveClass('flex-1')
  })

  it('gives the buyer select the same height as the price input and date picker', () => {
    render(<VehicleSaleForm vehicleId="v-1" leads={leads} onCancel={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByLabelText(/preço de venda/i)).toHaveClass('h-11')
    expect(screen.getByLabelText(/data da venda/i)).toHaveClass('h-11')
    expect(screen.getByLabelText(/comprador/i)).toHaveClass('h-11')
  })
})
