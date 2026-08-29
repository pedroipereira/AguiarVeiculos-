import { describe, it, expect, vi } from 'vitest'
import { uploadVehicleImage, validateImageFile } from '@/lib/storage'

describe('validateImageFile', () => {
  it('accepts jpg, png and webp under 5 MB', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateImageFile(new File(['x'], `foto.${type}`, { type }))).toBeNull()
    }
  })

  it('rejects an unsupported type', () => {
    const pdf = new File(['x'], 'documento.pdf', { type: 'application/pdf' })
    expect(validateImageFile(pdf)).toMatch(/não é um formato aceito/i)
  })

  it('rejects a file over 5 MB', () => {
    const big = new File(['x'], 'enorme.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 })
    expect(validateImageFile(big)).toMatch(/passa de 5 MB/i)
  })
})

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
