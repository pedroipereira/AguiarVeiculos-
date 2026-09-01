import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeYears } from '@/lib/fipe'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const marca = params.get('marca')
  const modelo = params.get('modelo')
  if (!marca || !modelo) return NextResponse.json({ error: 'Informe marca e modelo.' }, { status: 400 })

  try {
    const years = await fetchFipeYears(marca, modelo)
    return NextResponse.json(years)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar os anos na FIPE.' }, { status: 502 })
  }
}
