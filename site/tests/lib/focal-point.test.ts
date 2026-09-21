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
