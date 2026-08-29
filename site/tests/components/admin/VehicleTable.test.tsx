import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { adminDeleteVehicle, adminSetVehicleFeatured } = vi.hoisted(() => ({
  adminDeleteVehicle: vi.fn(),
  adminSetVehicleFeatured: vi.fn(),
}))
vi.mock('@/app/actions/vehicles', () => ({ adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus: vi.fn() }))
vi.spyOn(window, 'confirm').mockReturnValue(true)

import { VehicleTable } from '@/components/admin/VehicleTable'

const vehicles = [
  { id: '1', slug: 'fiat-argo-2023', brand: 'Fiat', model: 'Argo', version: 'Drive', year_model: 2023, price_cents: 6490000, is_featured: false, status: 'available', plate: 'DEF4G56' },
] as any

describe('VehicleTable', () => {
  it('lists vehicles and deletes on confirm', () => {
    render(<VehicleTable vehicles={vehicles} />)
    expect(screen.getByText(/fiat argo/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(adminDeleteVehicle).toHaveBeenCalledWith('1')
  })

  it('toggles destaque', () => {
    render(<VehicleTable vehicles={vehicles} />)
    fireEvent.click(screen.getByRole('button', { name: /marcar como destaque/i }))
    expect(adminSetVehicleFeatured).toHaveBeenCalledWith('1', true)
  })
})
