import type { SupabaseClient } from '@supabase/supabase-js'
import type { Testimonial } from '../types'

export async function getPublishedTestimonials(client: SupabaseClient): Promise<Testimonial[]> {
  const { data, error } = await client
    .from('testimonials_published')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return data as Testimonial[]
}
