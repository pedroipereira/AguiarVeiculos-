import { describe, it, expect, vi } from 'vitest'
import { saveVehicle, deleteVehicle, setVehicleFeatured, setVehicleStatus, markVehicleSold } from '@/lib/actions/vehicles'

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

  it('includes acquisition cost, minimum sale price, acquired date, FIPE fields, and optionals when provided', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
      acquisitionCostCents: 4000000, minSalePriceCents: 4200000, acquiredAt: '2026-08-01',
      fipeBrandCode: '21', fipeModelCode: '437', fipeYearCode: '1987-1',
      fipeValueCents: 614700, fipeFetchedAt: '2026-08-01T12:00:00.000Z',
      optionals: ['Ar condicionado', 'Teto solar'],
    })
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      acquisition_cost_cents: 4000000, min_sale_price_cents: 4200000, acquired_at: '2026-08-01',
      fipe_brand_code: '21', fipe_model_code: '437', fipe_year_code: '1987-1',
      fipe_value_cents: 614700, fipe_fetched_at: '2026-08-01T12:00:00.000Z',
      optionals: ['Ar condicionado', 'Teto solar'],
    }))
  })

  it('writes null/empty for acquisition cost, minimum sale price, acquired date, FIPE fields, and optionals when not provided', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
    })
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      acquisition_cost_cents: null, min_sale_price_cents: null, acquired_at: null,
      fipe_brand_code: null, fipe_model_code: null, fipe_year_code: null, fipe_value_cents: null, fipe_fetched_at: null,
      optionals: [],
    }))
  })

  it('replaces vehicle_expenses with the current list on save', async () => {
    const { from, chain } = makeClient()
    await saveVehicle({ from } as any, {
      id: 'existing-id', brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
      expenses: [
        { category: 'pintura', amountCents: 50000 },
        { category: 'outros', description: 'Alarme', amountCents: 20000 },
      ],
    })
    expect(from).toHaveBeenCalledWith('vehicle_expenses')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.insert).toHaveBeenCalledWith([
      { vehicle_id: 'existing-id', category: 'pintura', description: null, amount_cents: 50000 },
      { vehicle_id: 'existing-id', category: 'outros', description: 'Alarme', amount_cents: 20000 },
    ])
  })

  it('rejects an expense with category "outros" and no description', async () => {
    const { from, chain } = makeClient()
    await expect(saveVehicle({ from } as any, {
      brand: 'Fiat', model: 'Argo', yearModel: 2023, yearFabrication: 2023,
      mileageKm: 32000, priceCents: 6490000, imagePaths: [],
      expenses: [{ category: 'outros', amountCents: 20000 }],
    } as any)).rejects.toThrow()
    expect(chain.insert).not.toHaveBeenCalled()
  })
})

describe('markVehicleSold', () => {
  it('sets status to sold and records sale price, date, and buyer', async () => {
    const { from, chain } = makeClient()
    // buyerLeadId must be a real UUID — markVehicleSoldSchema (Task 7) validates with .uuid().
    await markVehicleSold({ from } as any, 'v-1', { salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: '11111111-1111-1111-1111-111111111111' })
    expect(from).toHaveBeenCalledWith('vehicles')
    expect(chain.update).toHaveBeenCalledWith({
      status: 'sold', sale_price_cents: 6200000, sold_at: '2026-08-31', buyer_lead_id: '11111111-1111-1111-1111-111111111111',
    })
    expect(chain.eq).toHaveBeenCalledWith('id', 'v-1')
  })

  it('records the sale without a buyer when none was selected', async () => {
    const { from, chain } = makeClient()
    await markVehicleSold({ from } as any, 'v-1', { salePriceCents: 6200000, soldAt: '2026-08-31' })
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ buyer_lead_id: null }))
  })

  it('rejects a negative sale price', async () => {
    const { from } = makeClient()
    await expect(markVehicleSold({ from } as any, 'v-1', { salePriceCents: -100, soldAt: '2026-08-31' } as any)).rejects.toThrow()
  })

  it('moves the linked buyer lead to "vendeu" when a buyer is selected', async () => {
    const { from, chain } = makeClient()
    await markVehicleSold({ from } as any, 'v-1', {
      salePriceCents: 6200000, soldAt: '2026-08-31', buyerLeadId: '11111111-1111-1111-1111-111111111111',
    })
    expect(from).toHaveBeenCalledWith('leads')
    expect(chain.update).toHaveBeenCalledWith({ stage: 'vendeu' })
    expect(chain.eq).toHaveBeenCalledWith('id', '11111111-1111-1111-1111-111111111111')
  })

  it('does not touch the leads table when no buyer is selected', async () => {
    const { from } = makeClient()
    await markVehicleSold({ from } as any, 'v-1', { salePriceCents: 6200000, soldAt: '2026-08-31' })
    expect(from).not.toHaveBeenCalledWith('leads')
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

  it('clears sale price, date, and buyer when reverting to available', async () => {
    const { from, chain } = makeClient()
    await setVehicleStatus({ from } as any, 'v-1', 'available')
    expect(chain.update).toHaveBeenCalledWith({
      status: 'available', sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    })
  })

  it('clears sale price, date, and buyer when moving to preparing', async () => {
    const { from, chain } = makeClient()
    await setVehicleStatus({ from } as any, 'v-1', 'preparing')
    expect(chain.update).toHaveBeenCalledWith({
      status: 'preparing', sale_price_cents: null, sold_at: null, buyer_lead_id: null,
    })
  })

  it('does not touch sale fields when setting status to sold directly', async () => {
    const { from, chain } = makeClient()
    await setVehicleStatus({ from } as any, 'v-1', 'sold')
    expect(chain.update).toHaveBeenCalledWith({ status: 'sold' })
  })
})
