export interface FipeBrand { code: string; name: string }
export interface FipeModel { code: string; name: string }
export interface FipeYear { code: string; name: string }
export interface FipeValue { valueCents: number; fipeCode: string; referenceMonth: string }

export class FipeError extends Error {}

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros'

interface RawBrand { codigo: string; nome: string }
interface RawModelsResponse { modelos: { codigo: number; nome: string }[] }
interface RawYear { codigo: string; nome: string }
interface RawValue { Valor: string; CodigoFipe: string; MesReferencia: string }

export function parseFipeValueToCents(raw: string): number {
  const numeric = raw.replace(/[^\d,]/g, '').replace(',', '.')
  const reais = Number(numeric)
  if (Number.isNaN(reais) || numeric === '') throw new FipeError(`Valor FIPE inesperado: "${raw}"`)
  return Math.round(reais * 100)
}

export async function fetchFipeBrands(): Promise<FipeBrand[]> {
  const response = await fetch(`${BASE_URL}/marcas`)
  if (!response.ok) throw new FipeError(`FIPE (marcas) retornou status ${response.status}`)
  const data = (await response.json()) as RawBrand[]
  return data.map((b) => ({ code: b.codigo, name: b.nome }))
}

export async function fetchFipeModels(brandCode: string): Promise<FipeModel[]> {
  const response = await fetch(`${BASE_URL}/marcas/${encodeURIComponent(brandCode)}/modelos`)
  if (!response.ok) throw new FipeError(`FIPE (modelos) retornou status ${response.status}`)
  const data = (await response.json()) as RawModelsResponse
  return data.modelos.map((m) => ({ code: String(m.codigo), name: m.nome }))
}

export async function fetchFipeYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
  const response = await fetch(
    `${BASE_URL}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos`,
  )
  if (!response.ok) throw new FipeError(`FIPE (anos) retornou status ${response.status}`)
  const data = (await response.json()) as RawYear[]
  return data.map((y) => ({ code: y.codigo, name: y.nome }))
}

export async function fetchFipeValue(brandCode: string, modelCode: string, yearCode: string): Promise<FipeValue> {
  const response = await fetch(
    `${BASE_URL}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos/${encodeURIComponent(yearCode)}`,
  )
  if (!response.ok) throw new FipeError(`FIPE (valor) retornou status ${response.status}`)
  const data = (await response.json()) as RawValue
  return {
    valueCents: parseFipeValueToCents(data.Valor),
    fipeCode: data.CodigoFipe,
    referenceMonth: data.MesReferencia,
  }
}
