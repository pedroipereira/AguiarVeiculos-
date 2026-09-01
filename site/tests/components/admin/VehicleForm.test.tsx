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

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ brand: 'Fiat', model: 'Argo', priceCents: 6490000, imagePaths: expect.arrayContaining([expect.stringContaining('argo.jpg')]) }),
    ))
    expect(push).toHaveBeenCalledWith('/admin/veiculos')
  })

  it('saves motor, fuel tank, and seating capacity when filled in', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/motor/i), { target: { value: '1.6' } })
    fireEvent.change(screen.getByLabelText(/tanque de combustível/i), { target: { value: '55' } })
    fireEvent.change(screen.getByLabelText(/quantidade de pessoas/i), { target: { value: '5' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ engine: '1.6', fuelTankLiters: 55, seatingCapacity: 5 } as any),
    ))
  })

  it('saves body type, doors, and horsepower when filled in', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/tipo de carroceria/i), { target: { value: 'Hatch' } })
    fireEvent.change(screen.getByLabelText(/portas/i), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText(/potência/i), { target: { value: '115' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ bodyType: 'Hatch', doors: 4, horsepower: 115 } as any),
    ))
  })

  it('marks the vehicle as featured when "Destacar na Home" is checked', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.click(screen.getByLabelText(/destacar na home/i))

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ isFeatured: true } as any),
    ))
  })

  it('leaves the vehicle unfeatured when "Destacar na Home" is left unchecked', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ isFeatured: false } as any),
    ))
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

  it('shows the 15-photo cap in the label', () => {
    render(<VehicleForm />)
    expect(screen.getByText(/fotos do veículo \(até 15\)/i)).toBeInTheDocument()
  })

  it('only uploads up to the remaining slots when a selection would exceed the 15-photo cap', async () => {
    const images = Array.from({ length: 14 }, (_, i) => ({
      id: String(i), vehicle_id: 'v1', storage_path: `existing-${i}.jpg`, display_order: i,
    }))
    render(<VehicleForm images={images as any} />)
    const first = new File(['x'], 'primeira.jpg', { type: 'image/jpeg' })
    const second = new File(['x'], 'segunda.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/fotos/i), { target: { files: [first, second] } })

    expect(await screen.findByText(/limite de 15 fotos/i)).toBeInTheDocument()
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
    expect(upload).toHaveBeenCalledWith(expect.stringContaining('primeira.jpg'), first)
  })

  it('disables the file input and rejects new uploads once the vehicle already has 15 photos', async () => {
    const images = Array.from({ length: 15 }, (_, i) => ({
      id: String(i), vehicle_id: 'v1', storage_path: `existing-${i}.jpg`, display_order: i,
    }))
    render(<VehicleForm images={images as any} />)
    expect(screen.getByLabelText(/fotos/i)).toBeDisabled()
  })
})

describe('VehicleForm — câmbio e combustível', () => {
  it('saves the selected câmbio and combustível from the fixed dropdowns', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/câmbio/i), { target: { value: 'Automático' } })
    fireEvent.change(screen.getByLabelText(/^combustível$/i), { target: { value: 'Flex' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ transmission: 'Automático', fuelType: 'Flex' }),
    ))
  })

  it('normalizes the plate lookup fuel type to a fixed option before selecting it', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      brand: 'Fiat', model: 'Argo', fuelType: 'flex',
    }), { status: 200 })) as any

    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/placa/i), { target: { value: 'DEF4G56' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar dados/i }))

    expect(await screen.findByDisplayValue('Fiat')).toBeInTheDocument()
    expect(screen.getByLabelText(/^combustível$/i)).toHaveValue('Flex')
  })

  it("includes the vehicle's existing transmission value as an option even if it predates the fixed list", () => {
    const legacy = { id: 'v-1', brand: 'Fiat', model: 'Argo', transmission: 'Semi-automático' } as any
    render(<VehicleForm vehicle={legacy} />)
    expect(screen.getByRole('option', { name: 'Semi-automático' })).toBeInTheDocument()
  })
})

describe('VehicleForm — custos e data de aquisição', () => {
  it('saves acquisition cost, minimum sale price, and acquired date when filled in', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/custo de aquisição/i), { target: { value: '40000' } })
    fireEvent.change(screen.getByLabelText(/preço mínimo de venda/i), { target: { value: '42000' } })
    fireEvent.change(screen.getByLabelText(/data de aquisição/i), { target: { value: '2026-08-01' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ acquisitionCostCents: 4000000, minSalePriceCents: 4200000, acquiredAt: '2026-08-01' }),
    ))
  })

  it('omits acquisition cost, minimum sale price, and acquired date when left blank', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ acquisitionCostCents: undefined, minSalePriceCents: undefined, acquiredAt: undefined }),
    ))
  })
})

describe('VehicleForm — margem e gastos', () => {
  it('shows the estimated margin as price minus acquisition cost and expenses', () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.change(screen.getByLabelText(/custo de aquisição/i), { target: { value: '40000' } })
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    fireEvent.change(screen.getByLabelText(/valor do gasto 1/i), { target: { value: '2000' } })

    expect(screen.getByText(/margem estimada: r\$ 22.900/i)).toBeInTheDocument()
  })

  it('saves the entered expenses with the vehicle', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.click(screen.getByRole('button', { name: /adicionar gasto/i }))
    fireEvent.change(screen.getByLabelText(/categoria do gasto 1/i), { target: { value: 'lavagem_higienizacao' } })
    fireEvent.change(screen.getByLabelText(/valor do gasto 1/i), { target: { value: '150' } })

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ expenses: [{ category: 'lavagem_higienizacao', description: undefined, amountCents: 15000 }] }),
    ))
  })

  it('shows the realized margin (using the real sale price) once the vehicle is sold', () => {
    const sold = {
      id: 'v-1', brand: 'Fiat', model: 'Argo', price_cents: 6490000, status: 'sold',
      sale_price_cents: 6200000, acquisition_cost_cents: 4000000,
    } as any
    render(<VehicleForm vehicle={sold} />)
    expect(screen.getByText(/margem realizada: r\$ 22.000/i)).toBeInTheDocument()
  })
})

describe('VehicleForm — FIPE', () => {
  it('keeps the vehicle\'s already-saved FIPE data when the FIPE section is left untouched', async () => {
    const vehicle = {
      id: 'v-1', brand: 'Fiat', model: 'Argo',
      fipe_brand_code: '21', fipe_model_code: '437', fipe_year_code: '1987-1',
      fipe_value_cents: 614700, fipe_fetched_at: '2026-08-01T12:00:00.000Z',
    } as any
    render(<VehicleForm vehicle={vehicle} />)
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(expect.objectContaining({
      fipeBrandCode: '21', fipeModelCode: '437', fipeYearCode: '1987-1',
      fipeValueCents: 614700, fipeFetchedAt: '2026-08-01T12:00:00.000Z',
    })))
  })
})

describe('VehicleForm — opcionais', () => {
  it('saves the selected optionals', async () => {
    render(<VehicleForm />)
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Fiat' } })
    fireEvent.change(screen.getByLabelText(/^modelo/i), { target: { value: 'Argo' } })
    fireEvent.change(screen.getByLabelText(/ano do modelo/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/ano de fabricação/i), { target: { value: '2023' } })
    fireEvent.change(screen.getByLabelText(/quilometragem/i), { target: { value: '32000' } })
    fireEvent.change(screen.getByLabelText(/preço \(em reais\)/i), { target: { value: '64900' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ar condicionado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Teto solar' }))

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => expect(adminSaveVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ optionals: ['Ar condicionado', 'Teto solar'] }),
    ))
  })

  it('pre-selects the pills for a vehicle that already has optionals', () => {
    const vehicle = { id: 'v-1', brand: 'Fiat', model: 'Argo', optionals: ['Blindagem'] } as any
    render(<VehicleForm vehicle={vehicle} />)
    expect(screen.getByRole('button', { name: 'Blindagem' })).toHaveAttribute('aria-pressed', 'true')
  })
})
