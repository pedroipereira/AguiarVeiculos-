import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchFipeBrands } from '@/lib/fipe'

export async function GET() {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const brands = await fetchFipeBrands()
    return NextResponse.json(brands)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar as marcas na FIPE.' }, { status: 502 })
  }
}
