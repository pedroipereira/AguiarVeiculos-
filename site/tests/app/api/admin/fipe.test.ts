import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipeValue } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchFipeBrands: vi.fn(),
  fetchFipeModels: vi.fn(),
  fetchFipeYears: vi.fn(),
  fetchFipeValue: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser } })),
}))

vi.mock('@/lib/fipe', () => ({
  fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipeValue,
  FipeError: class FipeError extends Error {},
}))

import { GET as GET_MARCAS } from '@/app/api/admin/fipe/marcas/route'
import { GET as GET_MODELOS } from '@/app/api/admin/fipe/modelos/route'
import { GET as GET_ANOS } from '@/app/api/admin/fipe/anos/route'
import { GET as GET_VALOR } from '@/app/api/admin/fipe/valor/route'

beforeEach(() => {
  getUser.mockReset()
  fetchFipeBrands.mockReset()
  fetchFipeModels.mockReset()
  fetchFipeYears.mockReset()
  fetchFipeValue.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
})

describe('GET /api/admin/fipe/marcas', () => {
  it('returns 401 without an authenticated session', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } })
    const response = await GET_MARCAS()
    expect(response.status).toBe(401)
  })

  it('returns the brand list', async () => {
    fetchFipeBrands.mockResolvedValueOnce([{ code: '21', name: 'Fiat' }])
    const response = await GET_MARCAS()
    expect(await response.json()).toEqual([{ code: '21', name: 'Fiat' }])
  })

  it('returns 502 when the FIPE client throws', async () => {
    fetchFipeBrands.mockRejectedValueOnce(new Error('boom'))
    const response = await GET_MARCAS()
    expect(response.status).toBe(502)
  })
})

describe('GET /api/admin/fipe/modelos', () => {
  it('returns 400 when marca is missing', async () => {
    const response = await GET_MODELOS(new Request('http://localhost/api/admin/fipe/modelos'))
    expect(response.status).toBe(400)
  })

  it('returns the model list for the given marca', async () => {
    fetchFipeModels.mockResolvedValueOnce([{ code: '437', name: '147 C/ CL' }])
    const response = await GET_MODELOS(new Request('http://localhost/api/admin/fipe/modelos?marca=21'))
    expect(fetchFipeModels).toHaveBeenCalledWith('21')
    expect(await response.json()).toEqual([{ code: '437', name: '147 C/ CL' }])
  })
})

describe('GET /api/admin/fipe/anos', () => {
  it('returns 400 when marca or modelo is missing', async () => {
    const response = await GET_ANOS(new Request('http://localhost/api/admin/fipe/anos?marca=21'))
    expect(response.status).toBe(400)
  })

  it('returns the year list for the given marca/modelo', async () => {
    fetchFipeYears.mockResolvedValueOnce([{ code: '1987-1', name: '1987 Gasolina' }])
    const response = await GET_ANOS(new Request('http://localhost/api/admin/fipe/anos?marca=21&modelo=437'))
    expect(fetchFipeYears).toHaveBeenCalledWith('21', '437')
    expect(await response.json()).toEqual([{ code: '1987-1', name: '1987 Gasolina' }])
  })
})

describe('GET /api/admin/fipe/valor', () => {
  it('returns 400 when any of marca/modelo/ano is missing', async () => {
    const response = await GET_VALOR(new Request('http://localhost/api/admin/fipe/valor?marca=21&modelo=437'))
    expect(response.status).toBe(400)
  })

  it('returns the value for the given marca/modelo/ano', async () => {
    fetchFipeValue.mockResolvedValueOnce({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' })
    const response = await GET_VALOR(new Request('http://localhost/api/admin/fipe/valor?marca=21&modelo=437&ano=1987-1'))
    expect(fetchFipeValue).toHaveBeenCalledWith('21', '437', '1987-1')
    expect(await response.json()).toEqual({ valueCents: 614700, fipeCode: '001124-0', referenceMonth: 'agosto de 2026' })
  })
})
