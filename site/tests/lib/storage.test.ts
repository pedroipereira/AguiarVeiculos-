import { describe, it, expect, vi } from 'vitest'
import { uploadVehicleImage, uploadSiteImage, validateImageFile, sanitizeFileName } from '@/lib/storage'

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

describe('uploadSiteImage', () => {
  it('uploads to the site-images bucket and returns the storage path', async () => {
    const upload = vi.fn(async () => ({ error: null }))
    const client = { storage: { from: vi.fn(() => ({ upload })) } }
    const file = new File(['x'], 'showroom.jpg', { type: 'image/jpeg' })
    const path = await uploadSiteImage(client as any, file)
    expect(client.storage.from).toHaveBeenCalledWith('site-images')
    expect(path).toContain('showroom.jpg')
  })

  it('sanitizes a filename with accents and spaces so Supabase Storage does not reject the key', async () => {
    // Regression: a macOS screenshot named "Captura de Tela ... às ....png" was
    // rejected by Storage with a 400 InvalidKey, which the UI only ever showed
    // as a generic "não foi possível enviar a foto" with no way to tell why.
    const upload = vi.fn(async () => ({ error: null }))
    const client = { storage: { from: vi.fn(() => ({ upload })) } }
    const file = new File(['x'], 'Captura de Tela 2026-09-04 às 13.49.04.png', { type: 'image/png' })
    const path = await uploadSiteImage(client as any, file)
    expect(path).toMatch(/^[a-zA-Z0-9._-]+$/)
  })
})

describe('sanitizeFileName', () => {
  it('strips accents and replaces spaces/unsafe characters with a hyphen', () => {
    expect(sanitizeFileName('Captura de Tela 2026-09-04 às 13.49.04.png')).toBe(
      'Captura-de-Tela-2026-09-04-as-13.49.04.png',
    )
  })

  it('leaves an already-safe filename untouched', () => {
    expect(sanitizeFileName('polo.jpg')).toBe('polo.jpg')
  })
})
