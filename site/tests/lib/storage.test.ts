import { describe, it, expect, vi } from 'vitest'
import { uploadVehicleImage } from '@/lib/storage'

describe('uploadVehicleImage', () => {
  it('uploads to the vehicle-images bucket and returns the storage path', async () => {
    const upload = vi.fn(async () => ({ error: null }))
    const client = { storage: { from: vi.fn(() => ({ upload })) } }
    const file = new File(['x'], 'polo.jpg', { type: 'image/jpeg' })
    const path = await uploadVehicleImage(client as any, file)
    expect(client.storage.from).toHaveBeenCalledWith('vehicle-images')
    expect(path).toContain('polo.jpg')
  })
})
