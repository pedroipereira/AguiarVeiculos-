'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/actions/assert-admin'
import * as siteImageActions from '@/lib/actions/site-images'
import type { SiteImageSlot } from '@/lib/types'

export async function adminAddSiteImage(slot: SiteImageSlot, storagePath: string) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  const result = await siteImageActions.addSiteImage(client, slot, storagePath)
  revalidatePath('/admin/imagens')
  revalidatePath('/')
  return result
}

export async function adminDeleteSiteImage(id: string) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await siteImageActions.deleteSiteImage(client, id)
  revalidatePath('/admin/imagens')
  revalidatePath('/')
}

export async function adminReplaceSiteImage(slot: SiteImageSlot, storagePath: string) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  const result = await siteImageActions.replaceSiteImage(client, slot, storagePath)
  revalidatePath('/admin/imagens')
  revalidatePath('/')
  return result
}
