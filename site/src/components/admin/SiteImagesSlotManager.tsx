'use client'

import { useState, type ChangeEvent } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadSiteImage, validateImageFile, getPublicImageUrl } from '@/lib/storage'
import { adminAddSiteImage, adminDeleteSiteImage, adminReorderSiteImages } from '@/app/actions/site-images'
import { reorderById } from '@/lib/reorder'
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

function SortableImageCard({ image, title, onDelete }: { image: SiteImageEntry; title: string; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-label={`Arrastar para reordenar: ${title}`}
      className={`group relative aspect-square cursor-grab touch-none overflow-hidden rounded-xl bg-card-gray ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={title} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onDelete(image.id) }}
        className="absolute right-2 top-2 rounded-full bg-graphite/70 px-2.5 py-1 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        Excluir
      </button>
    </div>
  )
}

export function SiteImagesSlotManager({ slot, title, description, initialImages }: SiteImagesSlotManagerProps) {
  const [images, setImages] = useState<SiteImageEntry[]>(initialImages)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    setImages((current) => {
      const reordered = reorderById(current, String(active.id), String(over.id))
      if (reordered !== current) adminReorderSiteImages(reordered.map((image) => image.id))
      return reordered
    })
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
        <>
          <p className="text-xs text-support-gray">Arraste as fotos para reordenar.</p>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.map((image) => (
                  <SortableImageCard key={image.id} image={image} title={title} onDelete={handleDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </section>
  )
}
