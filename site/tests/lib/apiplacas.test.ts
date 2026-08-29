import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchVehicleDataByPlate, ApiPlacasError } from '@/lib/apiplacas'

const originalFetch = global.fetch

beforeEach(() => {
  process.env.APIPLACAS_API_KEY = 'test-key'
})

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('fetchVehicleDataByPlate', () => {
  it('maps a successful ApiPlacas response to ApiPlacasResult', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      MARCA: 'FIAT', MODELO: 'ARGO', ano: '2023', anoModelo: '2023', cor: 'PRATA', combustivel: 'FLEX',
    }), { status: 200 })) as any

    const result = await fetchVehicleDataByPlate('DEF4G56')
    expect(result).toEqual({
      brand: 'FIAT', model: 'ARGO', yearFabrication: 2023, yearModel: 2023, color: 'PRATA', fuelType: 'FLEX',
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('DEF4G56'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-key' }) }),
    )
  })

  it('throws ApiPlacasError when the external API returns an error status', async () => {
    global.fetch = vi.fn(async () => new Response('erro', { status: 404 })) as any
    await expect(fetchVehicleDataByPlate('ZZZ0000')).rejects.toThrow(ApiPlacasError)
  })

  it('throws ApiPlacasError when the API key is missing', async () => {
    delete process.env.APIPLACAS_API_KEY
    await expect(fetchVehicleDataByPlate('DEF4G56')).rejects.toThrow(ApiPlacasError)
  })
})
