import { parseFocalX, focalOffset } from '@/lib/focal-point'

describe('parseFocalX', () => {
  it('reads the focus from the end of the file name, before the extension', () => {
    expect(parseFocalX('https://x.supabase.co/storage/v1/object/public/site-images/1a2b-galeria-05-recepcao-x63.jpg')).toBe(63)
    expect(parseFocalX('abc-hero-01-fachada-x59.jpeg')).toBe(59)
    expect(parseFocalX('abc-foto-x5.webp')).toBe(5)
  })

  it('ignores a query string after the file name', () => {
    expect(parseFocalX('/a/b-galeria-x21.jpg?v=3')).toBe(21)
  })

  it('returns nothing when the name has no focus, or the number is out of 0 to 100', () => {
    expect(parseFocalX('/images/fotos/showroom-fachada.jpg')).toBeUndefined()
    expect(parseFocalX('/a/b-foto-x150.jpg')).toBeUndefined()
    expect(parseFocalX('/a/b-x63-copia.jpg')).toBeUndefined()
    expect(parseFocalX(undefined)).toBeUndefined()
  })
})

describe('focalOffset', () => {
  it('puts the focus in the middle of the box, never showing empty space past the photo edges', () => {
    const css = focalOffset(63)
    expect(css).toContain('clamp(')
    expect(css).toContain('0.63')
    // The photo is 16:9, so its scaled width is the larger of the box width and 16/9 of the box height.
    expect(css).toContain('max(100cqw, 177.7778cqh)')
    expect(css).toContain('50cqw')
  })

  it('returns nothing without a focus, so the photo stays centered', () => {
    expect(focalOffset(undefined)).toBeUndefined()
  })
})

import { parsePhotoName, PORTRAIT_RATIO } from '@/lib/focal-point'

describe('parsePhotoName', () => {
  const U = 'https://x.supabase.co/storage/v1/object/public/site-images/0b3f6a52-1c2d-4e5f-8a9b-0c1d2e3f4a5b'

  it('reads the pair name, the portrait flag and the focus from the file name, ignoring the upload code', () => {
    expect(parsePhotoName(`${U}-galeria-01-fachada-rua-x24.jpg`)).toEqual({ key: 'galeria-01-fachada-rua', vertical: false, focalX: 24 })
    expect(parsePhotoName(`${U}-galeria-01-fachada-rua-vertical-x33.jpg`)).toEqual({ key: 'galeria-01-fachada-rua', vertical: true, focalX: 33 })
  })

  it('also understands the raw name from an upload with "(vertical)" in it', () => {
    expect(parsePhotoName(`${U}-galeria-01-fachada-rua-x24-vertical-.png`)).toEqual({ key: 'galeria-01-fachada-rua', vertical: true, focalX: 24 })
  })

  it('works without an upload code, without a focus and with a query string', () => {
    expect(parsePhotoName('/a.jpg')).toEqual({ key: 'a', vertical: false, focalX: undefined })
    expect(parsePhotoName('/a/foto-x21.jpg?v=3')).toEqual({ key: 'foto', vertical: false, focalX: 21 })
    expect(parsePhotoName('/a/foto-x150.jpg').focalX).toBeUndefined()
  })
})

describe('focalOffset for a portrait photo', () => {
  it('uses the 3:4 shape of the photo to know how much of it is hidden', () => {
    expect(PORTRAIT_RATIO).toBeCloseTo(0.75)
    expect(focalOffset(50, PORTRAIT_RATIO)).toContain('max(100cqw, 75.0000cqh)')
  })
})
