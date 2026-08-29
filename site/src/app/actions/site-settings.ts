'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { setSiteSetting } from '@/lib/actions/site-settings'

export async function adminSetSiteSetting(key: string, value: string) {
  const client = await createServerSupabaseClient()
  await setSiteSetting(client, key, value)
  revalidatePath('/admin/configuracoes')
  revalidatePath('/')
}
