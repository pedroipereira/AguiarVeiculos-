import { describe, it, expect } from 'vitest'
import { resolveColorHex } from '@/lib/colors'

describe('resolveColorHex', () => {
  it('resolves a known Portuguese color name to its hex swatch', () => {
    expect(resolveColorHex('Branco')).toBe('#f5f5f5')
    expect(resolveColorHex('vermelho')).toBe('#dc2626')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(resolveColorHex('  Prata  ')).toBe('#c4c4c4')
  })

  it('falls back to neutral gray for an unlisted or missing color', () => {
    expect(resolveColorHex('Azul Metálico Especial')).toBe('#9ca3af')
    expect(resolveColorHex(null)).toBe('#9ca3af')
    expect(resolveColorHex(undefined)).toBe('#9ca3af')
  })
})
