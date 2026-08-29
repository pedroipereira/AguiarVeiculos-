'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/actions/assert-admin'
import * as testimonialActions from '@/lib/actions/testimonials'
import type { SaveTestimonialInput } from '@/lib/actions/testimonials'

export async function adminSaveTestimonial(input: SaveTestimonialInput) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  const result = await testimonialActions.saveTestimonial(client, input)
  revalidatePath('/admin/depoimentos')
  revalidatePath('/')
  return result
}

export async function adminDeleteTestimonial(id: string) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await testimonialActions.deleteTestimonial(client, id)
  revalidatePath('/admin/depoimentos')
  revalidatePath('/')
}

export async function adminSetTestimonialPublished(id: string, isPublished: boolean) {
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await testimonialActions.setTestimonialPublished(client, id, isPublished)
  revalidatePath('/admin/depoimentos')
  revalidatePath('/')
}
