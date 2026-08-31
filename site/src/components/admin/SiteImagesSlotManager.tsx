'use client'

import { useState, type ChangeEvent } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadSiteImage, validateImageFile, getPublicImageUrl } from '@/lib/storage'
import { adminAddSiteImage, adminDeleteSiteImage } from '@/app/actions/site-images'
import type { SiteImageSlot } from '@/lib/types'

interface SiteImageEntry {
  id: string
  url: string
}

interface SiteImagesSlotManagerProps {
  slot: SiteImageSlot
  title: string
  description: string
  initialImages: SiteImageEntry[]
}

export function SiteImagesSlotManager({ slot, title, description, initialImages }: SiteImagesSlotManagerProps) {
  const [images, setImages] = useState<SiteImageEntry[]>(initialImages)
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

  async function handleAdd() {
    if (!pendingFile) return
    setUploading(true)
    setImageError(null)
    try {
      const client = createBrowserSupabaseClient()
      const path = await uploadSiteImage(client, pendingFile)
      const { id } = await adminAddSiteImage(slot, path)
      const url = getPublicImageUrl(client, 'site-images', path)
      setImages((current) => [...current, { id, url }])
      setPendingFile(null)
    } catch {
      setImageError('Não foi possível enviar a foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    setImages((current) => current.filter((image) => image.id !== id))
    await adminDeleteSiteImage(id)
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-support-gray">{description}</p>
      </div>

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
        onClick={handleAdd}
        disabled={!pendingFile || uploading}
        className="self-start rounded-full bg-aguiar-red px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? 'Enviando...' : 'Adicionar'}
      </button>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={title} className="h-32 w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                className="text-sm font-bold text-aguiar-red hover:underline"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
