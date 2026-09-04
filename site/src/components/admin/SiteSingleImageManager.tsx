'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadSiteImage, validateImageFile, getPublicImageUrl } from '@/lib/storage'
import { adminReplaceSiteImage } from '@/app/actions/site-images'
import type { SiteImageSlot } from '@/lib/types'

interface SiteSingleImageManagerProps {
  slot: SiteImageSlot
  title: string
  description: string
  initialImageUrl?: string
}

export function SiteSingleImageManager({ slot, title, description, initialImageUrl }: SiteSingleImageManagerProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl)
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    event.target.value = '' // allow re-picking the same file later
    setImageError(null)
    if (!file) return

    const problem = validateImageFile(file)
    if (problem) {
      setImageError(problem)
      return
    }

    setUploading(true)
    try {
      const client = createBrowserSupabaseClient()
      const path = await uploadSiteImage(client, file)
      await adminReplaceSiteImage(slot, path)
      setImageUrl(getPublicImageUrl(client, 'site-images', path))
    } catch {
      setImageError('Não foi possível enviar a foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-support-gray">{description}</p>
      </div>

      <div className="group relative aspect-video w-full max-w-md overflow-hidden rounded-xl bg-card-gray">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-support-gray">Nenhuma foto ainda</div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`absolute inset-0 flex items-center justify-center bg-graphite/60 text-sm font-bold uppercase tracking-wide text-white transition-opacity disabled:cursor-not-allowed ${
            imageUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
        >
          {uploading ? 'Enviando...' : imageUrl ? 'Trocar foto' : 'Adicionar foto'}
        </button>
      </div>

      <label htmlFor={`site-image-${slot}`} className="sr-only">Foto</label>
      <input
        ref={fileInputRef}
        id={`site-image-${slot}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        className="sr-only"
      />

      {imageError && <p className="text-sm text-aguiar-red">{imageError}</p>}
    </section>
  )
}
