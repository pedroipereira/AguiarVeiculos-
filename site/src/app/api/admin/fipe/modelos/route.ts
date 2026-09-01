import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeModels } from '@/lib/fipe'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const marca = new URL(request.url).searchParams.get('marca')
  if (!marca) return NextResponse.json({ error: 'Informe a marca.' }, { status: 400 })

  try {
    const models = await fetchFipeModels(marca)
    return NextResponse.json(models)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar os modelos na FIPE.' }, { status: 502 })
  }
}
