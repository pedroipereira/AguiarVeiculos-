import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipeValue, parseFipeValueToCents, FipeError } from '@/lib/fipe'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('parseFipeValueToCents', () => {
  it('parses a Brazilian-formatted currency string to integer cents', () => {
    expect(parseFipeValueToCents('R$ 6.147,00')).toBe(614700)
    expect(parseFipeValueToCents('R$ 64.900,50')).toBe(6490050)
  })

  it('throws FipeError for an unparseable value', () => {
    expect(() => parseFipeValueToCents('indisponível')).toThrow(FipeError)
  })
})

describe('fetchFipeBrands', () => {
  it('maps the raw brand list to {code, name}', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify([{ codigo: '21', nome: 'Fiat' }]), { status: 200 })) as any
    const result = await fetchFipeBrands()
    expect(result).toEqual([{ code: '21', name: 'Fiat' }])
  })

  it('throws FipeError on a non-ok response', async () => {
    global.fetch = vi.fn(async () => new Response('erro', { status: 500 })) as any
    await expect(fetchFipeBrands()).rejects.toThrow(FipeError)
  })
})

describe('fetchFipeModels', () => {
  it('maps the raw modelos list to {code, name}', async () => {
    global.fetch = vi.fn(async (url: string) => {
      expect(url).toContain('/marcas/21/modelos')
      return new Response(JSON.stringify({ modelos: [{ codigo: 437, nome: '147 C/ CL' }] }), { status: 200 })
    }) as any
    const result = await fetchFipeModels('21')
    expect(result).toEqual([{ code: '437', name: '147 C/ CL' }])
  })
})

describe('fetchFipeYears', () => {
  it('maps the raw anos list to {code, name}', async () => {
    global.fetch = vi.fn(async (url: string) => {
      expect(url).toContain('/marcas/21/modelos/437/anos')
      return new Response(JSON.stringify([{ codigo: '1987-1', nome: '1987 Gasolina' }]), { status: 200 })
    }) as any
    const result = await fetchFipeYears('21', '437')
    expect(result).toEqual([{ code: '1987-1', name: '1987 Gasolina' }])
  })
})

describe('fetchFipeValue', () => {
  it('parses the value and includes the FIPE reference code and month', async () => {
    global.fetch = vi.fn(async (url: string) => {
      expect(url).toContain('/marcas/21/modelos/437/anos/1987-1')
      return new Response(JSON.stringify({
        Valor: 'R$ 6.147,00', CodigoFipe: '001124-0', MesReferencia: 'agosto de 2026',
      }), { status: 200 })
    }) as any
    const result = await fetchFipeValue('21', '437', '1987-1')
    expect(result).toEqual({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' })
  })

  it('throws FipeError on a non-ok response', async () => {
    global.fetch = vi.fn(async () => new Response('erro', { status: 500 })) as any
    await expect(fetchFipeValue('21', '437', '1987-1')).rejects.toThrow(FipeError)
  })
})
