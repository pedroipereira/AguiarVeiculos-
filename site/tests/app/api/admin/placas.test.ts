import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, fetchVehicleDataByPlate } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchVehicleDataByPlate: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser } })),
}))

vi.mock('@/lib/puxaplaca', () => ({
  fetchVehicleDataByPlate,
  PuxaPlacaError: class PuxaPlacaError extends Error {},
}))

import { GET } from '@/app/api/admin/placas/route'

beforeEach(() => {
  getUser.mockReset()
  fetchVehicleDataByPlate.mockReset()
})

describe('GET /api/admin/placas', () => {
  it('returns 401 when there is no authenticated admin session', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } })
    const response = await GET(new Request('http://localhost/api/admin/placas?plate=DEF4G56'))
    expect(response.status).toBe(401)
  })

  it('returns the vehicle data for an authenticated request', async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
    fetchVehicleDataByPlate.mockResolvedValueOnce({ brand: 'Fiat', model: 'Argo' })
    const response = await GET(new Request('http://localhost/api/admin/placas?plate=DEF4G56'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ brand: 'Fiat', model: 'Argo' })
  })

  it('returns 502 with a friendly message when PuxaPlaca fails, never blocking manual entry', async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
    fetchVehicleDataByPlate.mockRejectedValueOnce(new Error('boom'))
    const response = await GET(new Request('http://localhost/api/admin/placas?plate=ZZZ0000'))
    expect(response.status).toBe(502)
    expect((await response.json()).error).toMatch(/não foi possível buscar/i)
  })
})
