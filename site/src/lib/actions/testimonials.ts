import type { SupabaseClient } from '@supabase/supabase-js'

export interface SaveTestimonialInput {
  id?: string
  imageUrl: string
  caption: string
}

/**
 * `display_order` is no longer a form field — reordering happens by
 * dragging in `TestimonialTable`, same as `addSiteImage`'s count-based
 * default. Editing a testimonial never touches its existing order.
 */
export async function saveTestimonial(client: SupabaseClient, input: SaveTestimonialInput): Promise<{ id: string }> {
  const payload = { image_url: input.imageUrl, caption: input.caption }
  if (input.id) {
    const { error } = await client.from('testimonials').update(payload).eq('id', input.id)
    if (error) throw error
    return { id: input.id }
  }

  const { count, error: countError } = await client.from('testimonials').select('id', { count: 'exact', head: true })
  if (countError) throw countError

  const { data, error } = await client
    .from('testimonials')
    .insert({ ...payload, display_order: count ?? 0 })
    .select('id')
    .single()
  if (error) throw error
  return data as { id: string }
}

export async function deleteTestimonial(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('testimonials').delete().eq('id', id)
  if (error) throw error
}

export async function setTestimonialPublished(client: SupabaseClient, id: string, isPublished: boolean): Promise<void> {
  const { error } = await client.from('testimonials').update({ is_published: isPublished }).eq('id', id)
  if (error) throw error
}

/** Persists a new display order: each id's index in `orderedIds` becomes its `display_order`. */
export async function reorderTestimonials(client: SupabaseClient, orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) => client.from('testimonials').update({ display_order: index }).eq('id', id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}
