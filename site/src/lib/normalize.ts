function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Builds a normalizer that maps free-text input to one of a fixed set of
 * canonical values whenever it recognizes a match (case/accent-insensitive),
 * so admins typing "automatico", "Automático", or "AUTOMÁTICO" all collapse
 * to the same stored value instead of creating separate public filter pills.
 * Unrecognized input is kept as-is (trimmed) rather than rejected, so a
 * genuinely new value never gets blocked.
 */
function makeNormalizer(canonicalValues: string[]) {
  const byKey = new Map(canonicalValues.map((value) => [stripAccents(value).toLowerCase(), value]))
  return function normalize(value: string | null | undefined): string | null {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    return byKey.get(stripAccents(trimmed).toLowerCase()) ?? trimmed
  }
}

export const TRANSMISSION_OPTIONS = ['Manual', 'Automático', 'Automático CVT']
export const FUEL_TYPE_OPTIONS = ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido', 'GNV']
export const COLOR_OPTIONS = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Grafite', 'Vermelho', 'Azul',
  'Verde', 'Amarelo', 'Marrom', 'Bege', 'Dourado', 'Vinho', 'Laranja', 'Rosa', 'Roxo',
]

export const normalizeTransmission = makeNormalizer(TRANSMISSION_OPTIONS)
export const normalizeFuelType = makeNormalizer(FUEL_TYPE_OPTIONS)
export const normalizeColor = makeNormalizer(COLOR_OPTIONS)

/**
 * Select-options list for a normalized field, guaranteed to include the
 * record's current stored value even if it predates the canonical list
 * (so editing an old/legacy row never silently blanks or loses its value).
 */
export function withCurrentValue(options: string[], current: string | null | undefined): string[] {
  if (!current || options.includes(current)) return options
  return [current, ...options]
}
