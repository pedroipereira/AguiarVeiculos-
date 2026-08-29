import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchVehicleDataByPlate } from '@/lib/apiplacas'

export async function GET(request: Request) {
  const client = await createServerSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const plate = new URL(request.url).searchParams.get('plate')
  if (!plate) return NextResponse.json({ error: 'Informe a placa.' }, { status: 400 })

  try {
    const result = await fetchVehicleDataByPlate(plate)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Não foi possível buscar os dados da placa. Preencha manualmente.' }, { status: 502 })
  }
}
