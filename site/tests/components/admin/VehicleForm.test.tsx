import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const { adminSaveVehicle } = vi.hoisted(() => ({ adminSaveVehicle: vi.fn(async () => ({ id: 'v-1' })) }))
vi.mock('@/app/actions/vehicles', () => ({ adminSaveVehicle }))

const upload = vi.fn(async () => ({ error: null }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload }) } }),
}))

import { VehicleForm } from '@/components/admin/VehicleForm'

describe('VehicleForm', () => {
  it('uploads a photo, fills required fields, and saves the vehicle', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })

    const file = new File(['x'], 'argo.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/fotos/i), { target: { files: [file] } })
    await waitFor(() => expect(upload).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /salvar veículo/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ brand: 'Fiat', model: 'Argo', priceCents: 6490000, imagePaths: expect.arrayContaining([expect.stringContaining('argo.jpg')]) }),
    ))
    expect(push).toHaveBeenCalledWith('/admin/veiculos')
  })
})

describe('VehicleForm — buscar por placa', () => {
  it('prefills brand/model/color/fuel from a successful plate lookup', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      brand: 'Fiat', model: 'Argo', color: 'Prata', fuelType: 'Flex',
    }), { status: 200 })) as any

    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/placa/i), { target: { value: 'DEF4G56' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar dados/i }))

    expect(await screen.findByDisplayValue('Fiat')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Argo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Prata')).toBeInTheDocument()
  })

  it('shows a warning and keeps the form editable when the lookup fails', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'Não foi possível buscar os dados da placa. Preencha manualmente.' }), { status: 502 })) as any

    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/placa/i), { target: { value: 'ZZZ0000' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar dados/i }))

    expect(await screen.findByText(/não foi possível buscar/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/marca/i)).not.toBeDisabled()
  })
})

describe('VehicleForm — validação de upload', () => {
  beforeEach(() => { upload.mockClear() })

  it('rejects a file over 5 MB with a message and never uploads it', async () => {
    render(<VehicleForm />)
    const big = new File(['x'], 'enorme.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/fotos/i), { target: { files: [big] } })

    expect(await screen.findByText(/passa de 5 mb/i)).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })

  it('rejects a file whose type is not jpg/png/webp, even though `accept` can be bypassed', async () => {
    render(<VehicleForm />)
    const pdf = new File(['x'], 'documento.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(/fotos/i), { target: { files: [pdf] } })

    expect(await screen.findByText(/não é um formato aceito/i)).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })

  it('still uploads the valid files when only some of the selection is rejected', async () => {
    render(<VehicleForm />)
    const ok = new File(['x'], 'boa.jpg', { type: 'image/jpeg' })
    const bad = new File(['x'], 'documento.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(/fotos/i), { target: { files: [ok, bad] } })

    expect(await screen.findByText(/não é um formato aceito/i)).toBeInTheDocument()
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
  })
})
