'use client'

import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { adminDeleteTestimonial, adminSetTestimonialPublished, adminReorderTestimonials } from '@/app/actions/testimonials'
import { reorderById } from '@/lib/reorder'
import type { Testimonial } from '@/lib/types'

interface SortableTestimonialCardProps {
  testimonial: Testimonial
  onTogglePublished: (id: string, next: boolean) => void
  onDelete: (id: string) => void
}

function SortableTestimonialCard({ testimonial, onTogglePublished, onDelete }: SortableTestimonialCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: testimonial.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-label={`Arrastar para reordenar: ${testimonial.caption}`}
      className={`flex cursor-grab touch-none items-center gap-4 rounded-xl border border-support-gray/15 bg-white p-4 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={testimonial.image_url} alt={testimonial.caption} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <p className="flex-1 text-sm text-graphite">{testimonial.caption}</p>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onTogglePublished(testimonial.id, !testimonial.is_published) }}
          className="text-xs font-bold text-graphite hover:underline"
        >
          {testimonial.is_published ? 'Despublicar' : 'Publicar'}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            if (window.confirm('Excluir este depoimento?')) onDelete(testimonial.id)
          }}
          className="text-xs font-bold text-aguiar-red hover:underline"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

export function TestimonialTable({ initialTestimonials }: { initialTestimonials: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState(initialTestimonials)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleTogglePublished(id: string, next: boolean) {
    setTestimonials((current) => current.map((testimonial) => (testimonial.id === id ? { ...testimonial, is_published: next } : testimonial)))
    adminSetTestimonialPublished(id, next)
  }

  function handleDelete(id: string) {
    setTestimonials((current) => current.filter((testimonial) => testimonial.id !== id))
    adminDeleteTestimonial(id)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    setTestimonials((current) => {
      const reordered = reorderById(current, String(active.id), String(over.id))
      if (reordered !== current) adminReorderTestimonials(reordered.map((testimonial) => testimonial.id))
      return reordered
    })
  }

  if (testimonials.length === 0) {
    return <p className="text-sm text-support-gray">Nenhum depoimento ainda.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-support-gray">Arraste os depoimentos para reordenar.</p>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={testimonials.map((testimonial) => testimonial.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-col gap-3">
            {testimonials.map((testimonial) => (
              <SortableTestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                onTogglePublished={handleTogglePublished}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
