'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/actions/assert-admin'
import { setSiteSetting } from '@/lib/actions/site-settings'

export async function adminSetSiteSetting(key: string, value: string) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await setSiteSetting(client, key, value)
  revalidatePath('/admin/configuracoes')
  revalidatePath('/')
}
