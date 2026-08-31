const COLOR_HEX_MAP: Record<string, string> = {
  branco: '#f5f5f5',
  preto: '#1a1a1a',
  prata: '#c4c4c4',
  cinza: '#8c8c8c',
  grafite: '#4a4a4a',
  chumbo: '#4a4a4a',
  vermelho: '#dc2626',
  azul: '#2563eb',
  verde: '#16a34a',
  amarelo: '#eab308',
  marrom: '#78350f',
  bege: '#d9c9a3',
  dourado: '#ca8a04',
  vinho: '#7f1d1d',
  laranja: '#ea580c',
  rosa: '#ec4899',
  roxo: '#7c3aed',
}

/** Resolves a Portuguese color name to a real swatch color, falling back to neutral gray for anything unlisted. */
export function resolveColorHex(colorName: string | null | undefined): string {
  const key = (colorName ?? '').toLowerCase().trim()
  return COLOR_HEX_MAP[key] ?? '#9ca3af'
}
