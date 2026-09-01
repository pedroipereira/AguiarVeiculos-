import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUser, deleteChain, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn(),
  deleteChain: { delete: vi.fn(() => deleteChain), eq: vi.fn(async () => ({ error: null })) } as any,
  revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => deleteChain),
  })),
}))

import { adminDeleteVehicle, adminMarkVehicleSold } from '@/app/actions/vehicles'
import { adminSetSiteSetting } from '@/app/actions/site-settings'

describe('admin server actions — explicit auth check', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('adminDeleteVehicle rejects an unauthenticated call before touching the database', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(adminDeleteVehicle('v-1')).rejects.toThrow('Não autenticado.')
    expect(deleteChain.delete).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('adminDeleteVehicle proceeds for an authenticated admin', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    await adminDeleteVehicle('v-1')
    expect(deleteChain.delete).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/admin/veiculos')
  })

  it('adminSetSiteSetting rejects an unauthenticated call too', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(adminSetSiteSetting('location_video_url', 'https://x')).rejects.toThrow('Não autenticado.')
  })

  it('adminMarkVehicleSold rejects an unauthenticated call before touching the database', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(adminMarkVehicleSold('v-1', { salePriceCents: 100, soldAt: '2026-08-31' })).rejects.toThrow('Não autenticado.')
  })
})
