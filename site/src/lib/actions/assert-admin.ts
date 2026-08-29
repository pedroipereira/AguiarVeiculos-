import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Defense in depth for the admin server actions: middleware already guards the
 * `/admin` routes and RLS already rejects unauthenticated writes, but a server
 * action is a public HTTP endpoint of its own, so it checks the session itself
 * — the same pattern as `app/api/admin/placas/route.ts`.
 */
export async function assertAdmin(client: SupabaseClient): Promise<void> {
  const { data } = await client.auth.getUser()
  if (!data?.user) throw new Error('Não autenticado.')
}
