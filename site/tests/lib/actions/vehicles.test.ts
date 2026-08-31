import { describe, it, expect, vi } from 'vitest'
import { saveVehicle, deleteVehicle, setVehicleFeatured, setVehicleStatus } from '@/lib/actions/vehicles'

function makeClient(overrides: Partial<Record<string, any>> = {}) {
  const chain: any = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(async () => ({ data: { id: 'new-id' }, error: null })),
    ...overrides,
  }
  return { from: vi.fn(() => chain), chain }
}

describe('saveVehicle', () => {
  it('inserts a new vehicle and its images when no id is given', async () => {
    const { from, chain } = makeClient()
    const result = await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: ['vehicle-images/a.jpg'],
    })
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(chain.insert).toHaveBeenCalled()
    expect(from).toHaveBeenCalledWith('vehicle_images')
    expect(result).toEqual({ id: 'new-id' })
  })

  it('normalizes transmission, fuel type, and color before saving', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
      transmission: 'automatico', fuelType: 'eletrico', color: 'BRANCO',
    })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ transmission: 'Automático', fuel_type: 'Elétrico', color: 'Branco' }),
    )
  })

  it('includes engine, fuel tank, and seating capacity when provided', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
      engine: '1.6', fuelTankLiters: 55, seatingCapacity: 5,
    })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ engine: '1.6', fuel_tank_liters: 55, seating_capacity: 5 }),
    )
  })

  it('writes null for engine, fuel tank, and seating capacity when not provided', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ engine: null, fuel_tank_liters: null, seating_capacity: null }),
    )
  })

  it('includes body type, doors, and horsepower when provided', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
      bodyType: 'Hatch', doors: 4, horsepower: 115,
    })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ body_type: 'Hatch', doors: 4, horsepower: 115 }),
    )
  })

  it('writes null for body type, doors, and horsepower when not provided', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ body_type: null, doors: null, horsepower: null }),
    )
  })

  it('sets the slug only when creating', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    })
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ slug: expect.stringMatching(/^fiat-argo-2023-[0-9a-f]{8}$/) }))
  })

  it('updates an existing vehicle by id', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      id: 'existing-id', brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    })
    expect(chain.update).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'existing-id')
  })

  it('never rewrites the slug on edit — already-shared links must keep working', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      id: 'existing-id', brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    })
    const payload = chain.update.mock.calls[0][0]
    expect(payload).not.toHaveProperty('slug')
    expect(payload).toMatchObject({ brand: 'Fiat', model: 'Argo', year_model: 2023 })
  })

  it('rejects an invalid payload instead of writing it to the database', async () => {
    const { from, chain } = makeClient()
    await expect(saveVehicle({ from } as any, {
      brand: '', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    } as any)).rejects.toThrow()
    expect(chain.insert).not.toHaveBeenCalled()
  })

  it('rejects a NaN year (blank number field) instead of writing NaN to a not null column', async () => {
    const { from, chain } = makeClient()
    await expect(saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: Number('abc'), yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    } as any)).rejects.toThrow()
    expect(chain.insert).not.toHaveBeenCalled()
  })
})

describe('deleteVehicle', () => {
  it('deletes the vehicle by id', async () => {
    const { from, chain } = makeClient()
    await deleteVehicle({ from } as any, 'v-1')
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'v-1')
  })
})

describe('setVehicleFeatured / setVehicleStatus', () => {
  it('updates is_featured', async () => {
    const { from, chain } = makeClient()
    await setVehicleFeatured({ from } as any, 'v-1', true)
    expect(chain.update).toHaveBeenCalledWith({ is_featured: true })
  })

  it('updates status', async () => {
    const { from, chain } = makeClient()
    await setVehicleStatus({ from } as any, 'v-1', 'sold')
    expect(chain.update).toHaveBeenCalledWith({ status: 'sold' })
  })
})
