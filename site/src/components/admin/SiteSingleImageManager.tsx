'use client'

import { useState, type ChangeEvent } from 'react'
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
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setImageError(null)
    if (!file) {
      setPendingFile(null)
      return
    }
    const problem = validateImageFile(file)
    if (problem) {
      setImageError(problem)
      setPendingFile(null)
      return
    }
    setPendingFile(file)
  }

  async function handleSave() {
    if (!pendingFile) return
    setUploading(true)
    setImageError(null)
    try {
      const client = createBrowserSupabaseClient()
      const path = await uploadSiteImage(client, pendingFile)
      await adminReplaceSiteImage(slot, path)
      setImageUrl(getPublicImageUrl(client, 'site-images', path))
      setPendingFile(null)
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

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} className="h-40 w-full max-w-xs rounded-lg object-cover" />
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`site-image-${slot}`} className="text-sm font-bold">Foto</label>
        <input
          id={`site-image-${slot}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          className="rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite"
        />
        {imageError && <p className="text-sm text-aguiar-red">{imageError}</p>}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!pendingFile || uploading}
        className="self-start rounded-full bg-aguiar-red px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? 'Enviando...' : imageUrl ? 'Trocar foto' : 'Adicionar foto'}
      </button>
    </section>
  )
}
