export interface PuxaPlacaResult {
  brand: string
  model: string
  yearFabrication?: number
  yearModel?: number
  color?: string
  fuelType?: string
  horsepower?: number
  seatingCapacity?: number
  engine?: string
  bodyType?: string
}

export class PuxaPlacaError extends Error {}

interface PuxaPlacaRawResponse {
  error?: boolean
  message?: string
  basico?: {
    error?: boolean
    message?: string
    dados?: {
      marca?: string
      modelo?: string
      cor?: string
      ano?: string
      anoModelo?: string
      combustivel?: string
      potencia?: string
      lotacao?: string
      cilindradas?: string
      tipoCarroceria?: string
    }
  }
}

// The API returns "0"/"0.0" as a sentinel for "not available" on several
// numeric fields (seen live for older/less-documented vehicles) rather than
// omitting the field — treat non-positive values the same as missing.
function parsePositiveNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

export async function fetchVehicleDataByPlate(plate: string): Promise<PuxaPlacaResult> {
  const apiKey = process.env.PUXAPLACA_TOKEN
  if (!apiKey) throw new PuxaPlacaError('PUXAPLACA_TOKEN não configurada.')

  const response = await fetch(`https://api.puxaplaca.app/v2/consulta/${encodeURIComponent(plate)}`, {
    headers: { token: apiKey, Accept: 'application/json' },
  })
  if (!response.ok) throw new PuxaPlacaError(`PuxaPlaca retornou status ${response.status}`)

  const data = (await response.json()) as PuxaPlacaRawResponse
  // The API reports errors via an `error` flag alongside a 200 status (in
  // addition to real HTTP error statuses), both at the top level and inside
  // each enabled "consulta" section — check both before trusting the body.
  if (data.error) throw new PuxaPlacaError(data.message ?? 'PuxaPlaca retornou erro.')

  const basico = data.basico
  if (!basico || basico.error) throw new PuxaPlacaError(basico?.message ?? 'PuxaPlaca não retornou dados básicos.')

  const dados = basico.dados
  if (!dados?.marca || !dados?.modelo) throw new PuxaPlacaError('Resposta da PuxaPlaca sem marca/modelo.')

  const cilindradasCc = parsePositiveNumber(dados.cilindradas)

  return {
    brand: dados.marca,
    model: dados.modelo,
    yearFabrication: dados.ano ? Number(dados.ano) : undefined,
    yearModel: dados.anoModelo ? Number(dados.anoModelo) : undefined,
    color: dados.cor,
    fuelType: dados.combustivel,
    horsepower: parsePositiveNumber(dados.potencia),
    seatingCapacity: parsePositiveNumber(dados.lotacao),
    // "cilindradas" comes back in cm³ (e.g. 1599); the form's "Motor" field
    // expects liters (e.g. "1.6"), matching how it's normally advertised.
    engine: cilindradasCc ? (cilindradasCc / 1000).toFixed(1) : undefined,
    bodyType: dados.tipoCarroceria?.trim() || undefined,
  }
}
