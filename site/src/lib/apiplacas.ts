export interface ApiPlacasResult {
  brand: string
  model: string
  yearFabrication?: number
  yearModel?: number
  color?: string
  fuelType?: string
}

export class ApiPlacasError extends Error {}

interface ApiPlacasRawResponse {
  MARCA?: string
  MODELO?: string
  ano?: string
  anoModelo?: string
  cor?: string
  // The real API (wdapi2.com.br) nests fuel type under `extra`, not at the top level.
  extra?: {
    combustivel?: string
  }
}

export async function fetchVehicleDataByPlate(plate: string): Promise<ApiPlacasResult> {
  const apiKey = process.env.APIPLACAS_TOKEN
  if (!apiKey) throw new ApiPlacasError('APIPLACAS_TOKEN não configurada.')

  // apiplacas.com.br is only the account/docs site — the actual API lives on
  // wdapi2.com.br, and the token is a URL path segment, not an auth header
  // (confirmed against the provider's real documentation).
  const response = await fetch(
    `https://wdapi2.com.br/consulta/${encodeURIComponent(plate)}/${encodeURIComponent(apiKey)}`,
  )
  if (!response.ok) throw new ApiPlacasError(`ApiPlacas retornou status ${response.status}`)

  const data = (await response.json()) as ApiPlacasRawResponse
  if (!data.MARCA || !data.MODELO) throw new ApiPlacasError('Resposta da ApiPlacas sem marca/modelo.')

  return {
    brand: data.MARCA,
    model: data.MODELO,
    yearFabrication: data.ano ? Number(data.ano) : undefined,
    yearModel: data.anoModelo ? Number(data.anoModelo) : undefined,
    color: data.cor,
    fuelType: data.extra?.combustivel,
  }
}
