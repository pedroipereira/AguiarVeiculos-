import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchVehicleDataByPlate, PuxaPlacaError } from '@/lib/puxaplaca'

const originalFetch = global.fetch

beforeEach(() => {
  process.env.PUXAPLACA_TOKEN = 'test-key'
})

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('fetchVehicleDataByPlate', () => {
  it('maps a successful PuxaPlaca response to PuxaPlacaResult', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      error: false,
      message: 'Consulta efetuada com sucesso',
      basico: {
        error: false,
        message: '',
        dados: {
          marca: 'FIAT', modelo: 'ARGO', ano: '2023', anoModelo: '2023', cor: 'PRATA', combustivel: 'FLEX',
          potencia: '116', lotacao: '5', cilindradas: '1000', tipoCarroceria: 'HATCH',
        },
      },
    }), { status: 200 })) as any

    const result = await fetchVehicleDataByPlate('DEF4G56')
    expect(result).toEqual({
      brand: 'FIAT', model: 'ARGO', yearFabrication: 2023, yearModel: 2023, color: 'PRATA', fuelType: 'FLEX',
      horsepower: 116, seatingCapacity: 5, engine: '1.0', bodyType: 'HATCH',
    })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.puxaplaca.app/v2/consulta/DEF4G56',
      expect.objectContaining({ headers: expect.objectContaining({ token: 'test-key' }) }),
    )
  })

  it('treats "0"/"0.0" sentinel values for potencia/lotacao/cilindradas as unavailable, not zero', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      error: false,
      basico: {
        error: false,
        dados: {
          marca: 'VW', modelo: 'PASSAT TS', ano: '1979', anoModelo: '1979', cor: 'AZUL', combustivel: 'Indeterminado',
          potencia: '0.0', lotacao: '0', cilindradas: '0',
        },
      },
    }), { status: 200 })) as any

    const result = await fetchVehicleDataByPlate('ABC1D23')
    expect(result.horsepower).toBeUndefined()
    expect(result.seatingCapacity).toBeUndefined()
    expect(result.engine).toBeUndefined()
    expect(result.bodyType).toBeUndefined()
  })

  it('throws PuxaPlacaError when the external API returns an HTTP error status', async () => {
    global.fetch = vi.fn(async () => new Response('erro', { status: 404 })) as any
    await expect(fetchVehicleDataByPlate('ZZZ0000')).rejects.toThrow(PuxaPlacaError)
  })

  it('throws PuxaPlacaError when the body reports an error despite a 200 status', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({
      error: true, message: 'Placa não encontrada',
    }), { status: 200 })) as any
    await expect(fetchVehicleDataByPlate('ZZZ0000')).rejects.toThrow(PuxaPlacaError)
  })

  it('throws PuxaPlacaError when the API key is missing', async () => {
    delete process.env.PUXAPLACA_TOKEN
    await expect(fetchVehicleDataByPlate('DEF4G56')).rejects.toThrow(PuxaPlacaError)
  })
})
