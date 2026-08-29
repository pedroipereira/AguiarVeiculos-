import type { SupabaseClient } from '@supabase/supabase-js'

export interface SaveTestimonialInput {
  id?: string
  imageUrl: string
  caption: string
  displayOrder: number
}

export async function saveTestimonial(client: SupabaseClient, input: SaveTestimonialInput): Promise<{ id: string }> {
  const payload = { image_url: input.imageUrl, caption: input.caption, display_order: input.displayOrder }
  if (input.id) {
    const { error } = await client.from('testimonials').update(payload).eq('id', input.id)
    if (error) throw error
    return { id: input.id }
  }
  const { data, error } = await client.from('testimonials').insert(payload).select('id').single()
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
