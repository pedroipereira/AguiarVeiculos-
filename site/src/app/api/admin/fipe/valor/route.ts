import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeValue } from '@/lib/fipe'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const marca = params.get('marca')
  const modelo = params.get('modelo')
  const ano = params.get('ano')
  if (!marca || !modelo || !ano) return NextResponse.json({ error: 'Informe marca, modelo e ano.' }, { status: 400 })

  try {
    const value = await fetchFipeValue(marca, modelo, ano)
    return NextResponse.json(value)
  } catch {
    return NextResponse.json({ error: 'Não foi possível consultar o preço na FIPE.' }, { status: 502 })
  }
}
