'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { adminSaveTestimonial } from '@/app/actions/testimonials'
import { validateImageFile } from '@/lib/storage'
import type { Testimonial } from '@/lib/types'
import { Button } from '@/components/ui/Button'

export function TestimonialForm({ testimonial }: { testimonial?: Testimonial }) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState(testimonial?.image_url ?? '')
  const [imageError, setImageError] = useState<string | null>(null)

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setImageError(null)
    if (!file) return

    const problem = validateImageFile(file)
    if (problem) {
      setImageError(problem)
      return
    }

    const client = createBrowserSupabaseClient()
    const path = `${crypto.randomUUID()}-${file.name}`
    const { error } = await client.storage.from('testimonial-images').upload(path, file)
    if (error) return
    const { data } = client.storage.from('testimonial-images').getPublicUrl(path)
    setImageUrl(data.publicUrl)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSaveTestimonial({
      id: testimonial?.id,
      imageUrl,
      caption: String(formData.get('caption')),
    })
    router.push('/admin/depoimentos')
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3">
      <label htmlFor="testimonial-image">Imagem</label>
      <input id="testimonial-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelected} />
      {imageError && <p className="text-aguiar-red">{imageError}</p>}
      <label htmlFor="caption">Legenda</label>
      <textarea id="caption" name="caption" defaultValue={testimonial?.caption} required className="rounded border p-2 text-graphite" />
      <Button type="submit">Salvar depoimento</Button>
    </form>
  )
}
